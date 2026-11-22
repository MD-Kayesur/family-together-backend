import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ParsedIndi {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  birthDate?: Date;
  birthPlace?: string;
  deathDate?: Date;
  isAlive: boolean;
  occupation?: string;
  bio?: string;
  fams: string[];
  famc?: string;
}

interface ParsedFam {
  id: string;
  husbandId?: string;
  wifeId?: string;
  children: string[];
}

@Injectable()
export class GedcomService {
  private readonly logger = new Logger(GedcomService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve the active family for an export or import request
   */
  private async resolveFamily(familyId?: string, userId?: string) {
    if (familyId) {
      const family = await this.prisma.family.findUnique({ where: { id: familyId } });
      if (family) return family;
    }

    if (userId) {
      const family = await this.prisma.family.findFirst({
        where: {
          OR: [
            { createdBy: userId },
            { members: { some: { person: { userId } } } },
          ],
        },
      });
      if (family) return family;
    }

    // Default to the first sanctuary in database
    const defaultFamily = await this.prisma.family.findFirst();
    if (!defaultFamily) {
      throw new NotFoundException('No family sanctuary found in database');
    }
    return defaultFamily;
  }

  /**
   * Export Family Tree to Standard GEDCOM 5.5.1 format
   */
  async exportGedcom(familyId?: string, userId?: string) {
    const family = await this.resolveFamily(familyId, userId);

    // Fetch members and relationships
    const members = await this.prisma.familyMember.findMany({
      where: { familyId: family.id },
      include: { person: true },
    });

    const persons = members.map((m) => m.person).filter(Boolean);
    const personIdToXref = new Map<string, string>();
    persons.forEach((p, idx) => {
      personIdToXref.set(p.id, `@I${idx + 1}@`);
    });

    const relationships = await this.prisma.relationship.findMany({
      where: { familyId: family.id },
      include: { relationshipType: true },
    });

    // Detect family groups (spouses & children)
    // Map of spousePairKey -> { husbandXref, wifeXref, children: string[] }
    const famGroups: { id: string; husb?: string; wife?: string; children: string[] }[] = [];
    const childToFam = new Map<string, string>();
    const spouseToFams = new Map<string, Set<string>>();

    // Process parent-child relationships
    const parentChildRel = relationships.filter(
      (r) => r.relationshipType?.code === 'PARENT_CHILD' || r.relationshipType?.category === 'BIOLOGICAL'
    );

    // Group parents by child
    const childParentsMap = new Map<string, string[]>();
    for (const rel of parentChildRel) {
      const parentXref = personIdToXref.get(rel.fromPersonId);
      const childXref = personIdToXref.get(rel.toPersonId);
      if (parentXref && childXref) {
        if (!childParentsMap.has(childXref)) {
          childParentsMap.set(childXref, []);
        }
        childParentsMap.get(childXref)!.push(parentXref);
      }
    }

    // Process spouse relationships
    const spouseRels = relationships.filter(
      (r) => r.relationshipType?.code === 'SPOUSE' || r.relationshipType?.category === 'MARRIAGE'
    );

    let famCounter = 1;
    const pairMap = new Map<string, string>();

    for (const rel of spouseRels) {
      const x1 = personIdToXref.get(rel.fromPersonId);
      const x2 = personIdToXref.get(rel.toPersonId);
      if (x1 && x2) {
        const pairKey = [x1, x2].sort().join('_');
        if (!pairMap.has(pairKey)) {
          const famId = `@F${famCounter++}@`;
          pairMap.set(pairKey, famId);
          famGroups.push({
            id: famId,
            husb: x1,
            wife: x2,
            children: [],
          });
          if (!spouseToFams.has(x1)) spouseToFams.set(x1, new Set());
          if (!spouseToFams.has(x2)) spouseToFams.set(x2, new Set());
          spouseToFams.get(x1)!.add(famId);
          spouseToFams.get(x2)!.add(famId);
        }
      }
    }

    // Attach children to existing FAM or create single-parent FAM
    for (const [childXref, parents] of childParentsMap.entries()) {
      let matchedFam: (typeof famGroups)[0] | undefined;
      if (parents.length >= 2) {
        const pKey = [parents[0], parents[1]].sort().join('_');
        const fId = pairMap.get(pKey);
        if (fId) {
          matchedFam = famGroups.find((f) => f.id === fId);
        }
      }
      if (!matchedFam && parents.length >= 1) {
        // Find any family where parent is spouse
        const pFamIds = spouseToFams.get(parents[0]);
        if (pFamIds && pFamIds.size > 0) {
          const fId = Array.from(pFamIds)[0];
          matchedFam = famGroups.find((f) => f.id === fId);
        }
      }

      if (!matchedFam) {
        // Create a new family group for this lineage
        const newFamId = `@F${famCounter++}@`;
        matchedFam = {
          id: newFamId,
          husb: parents[0],
          children: [],
        };
        famGroups.push(matchedFam);
        if (parents[0]) {
          if (!spouseToFams.has(parents[0])) spouseToFams.set(parents[0], new Set());
          spouseToFams.get(parents[0])!.add(newFamId);
        }
      }

      if (matchedFam && !matchedFam.children.includes(childXref)) {
        matchedFam.children.push(childXref);
        childToFam.set(childXref, matchedFam.id);
      }
    }

    // Format dates to GEDCOM standard (DD MMM YYYY)
    const formatGedcomDate = (d?: Date | null): string => {
      if (!d) return '';
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    };

    // Build GEDCOM 5.5.1 string
    const lines: string[] = [
      '0 HEAD',
      '1 SOUR FamilyRoots',
      '2 VERS 1.0.0',
      '2 NAME FamilyRoots Sanctuary Platform',
      '1 GEDC',
      '2 VERS 5.5.1',
      '2 FORM LINEAGE-LINKED',
      '1 CHAR UTF-8',
      `1 NOTE Exported from FamilyRoots Sanctuary: ${family.name}`,
    ];

    // Individual Records (INDI)
    for (const p of persons) {
      const xref = personIdToXref.get(p.id)!;
      lines.push(`0 ${xref} INDI`);
      lines.push(`1 NAME ${p.firstName || ''} /${p.lastName || ''}/`);
      if (p.firstName) lines.push(`2 GIVN ${p.firstName}`);
      if (p.lastName) lines.push(`2 SURN ${p.lastName}`);
      
      const sex = p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'U';
      lines.push(`1 SEX ${sex}`);

      if (p.dateOfBirth || p.birthPlace) {
        lines.push('1 BIRT');
        if (p.dateOfBirth) lines.push(`2 DATE ${formatGedcomDate(p.dateOfBirth)}`);
        if (p.birthPlace) lines.push(`2 PLAC ${p.birthPlace}`);
      }

      if (!p.isAlive || p.dateOfDeath) {
        lines.push('1 DEAT');
        if (p.dateOfDeath) lines.push(`2 DATE ${formatGedcomDate(p.dateOfDeath)}`);
      }

      if (p.occupation) {
        lines.push(`1 OCCU ${p.occupation}`);
      }

      if (p.bio) {
        lines.push(`1 NOTE ${p.bio.replace(/\r?\n/g, ' ')}`);
      }

      // Family links
      const famc = childToFam.get(xref);
      if (famc) {
        lines.push(`1 FAMC ${famc}`);
      }

      const famsSet = spouseToFams.get(xref);
      if (famsSet) {
        for (const fams of famsSet) {
          lines.push(`1 FAMS ${fams}`);
        }
      }
    }

    // Family Records (FAM)
    for (const fam of famGroups) {
      lines.push(`0 ${fam.id} FAM`);
      if (fam.husb) lines.push(`1 HUSB ${fam.husb}`);
      if (fam.wife) lines.push(`1 WIFE ${fam.wife}`);
      for (const child of fam.children) {
        lines.push(`1 CHIL ${child}`);
      }
    }

    lines.push('0 TRLR');

    const gedcomContent = lines.join('\n');
    const safeFamilyName = family.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    return {
      success: true,
      filename: `${safeFamilyName}_tree.ged`,
      familyId: family.id,
      familyName: family.name,
      totalPersons: persons.length,
      totalRelationships: relationships.length,
      gedcom: gedcomContent,
    };
  }

  /**
   * Import Family Tree from Standard GEDCOM 5.5.1 text or file
   */
  async importGedcom(gedcomText: string, familyId?: string, userId?: string) {
    if (!gedcomText || !gedcomText.trim()) {
      throw new BadRequestException('GEDCOM content cannot be empty');
    }

    const family = await this.resolveFamily(familyId, userId);
    this.logger.log(`Starting GEDCOM import into sanctuary: ${family.name} (${family.id})`);

    const lines = gedcomText.split(/\r?\n/);
    const indiMap = new Map<string, ParsedIndi>();
    const famMap = new Map<string, ParsedFam>();

    let currentIndi: ParsedIndi | null = null;
    let currentFam: ParsedFam | null = null;
    let currentContext: 'INDI' | 'FAM' | null = null;
    let lastTag: string = '';

    // Parse GEDCOM structure line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const tokens = line.split(/\s+/);
      const level = tokens[0];
      const tagOrXref = tokens[1];
      const rest = tokens.slice(2).join(' ');

      if (level === '0') {
        if (currentIndi) {
          indiMap.set(currentIndi.id, currentIndi);
          currentIndi = null;
        }
        if (currentFam) {
          famMap.set(currentFam.id, currentFam);
          currentFam = null;
        }

        if (tagOrXref.startsWith('@') && (rest === 'INDI' || tokens[2] === 'INDI')) {
          currentContext = 'INDI';
          currentIndi = {
            id: tagOrXref,
            firstName: 'Unknown',
            lastName: 'Relative',
            gender: 'UNKNOWN',
            isAlive: true,
            fams: [],
          };
        } else if (tagOrXref.startsWith('@') && (rest === 'FAM' || tokens[2] === 'FAM')) {
          currentContext = 'FAM';
          currentFam = {
            id: tagOrXref,
            children: [],
          };
        } else {
          currentContext = null;
        }
        lastTag = '';
      } else if (currentContext === 'INDI' && currentIndi) {
        if (tagOrXref === 'NAME') {
          const nameVal = rest;
          const match = nameVal.match(/(.*?)\s*\/(.*?)\//);
          if (match) {
            currentIndi.firstName = match[1].trim() || 'Unknown';
            currentIndi.lastName = match[2].trim() || '';
          } else {
            const parts = nameVal.split(' ');
            currentIndi.firstName = parts[0] || 'Unknown';
            currentIndi.lastName = parts.slice(1).join(' ') || '';
          }
        } else if (tagOrXref === 'GIVN') {
          currentIndi.firstName = rest || currentIndi.firstName;
        } else if (tagOrXref === 'SURN') {
          currentIndi.lastName = rest || currentIndi.lastName;
        } else if (tagOrXref === 'SEX') {
          const s = rest.toUpperCase();
          if (s === 'M') currentIndi.gender = 'MALE';
          else if (s === 'F') currentIndi.gender = 'FEMALE';
          else currentIndi.gender = 'OTHER';
        } else if (tagOrXref === 'BIRT') {
          lastTag = 'BIRT';
        } else if (tagOrXref === 'DEAT') {
          lastTag = 'DEAT';
          currentIndi.isAlive = false;
        } else if (tagOrXref === 'DATE') {
          const parsedDate = new Date(rest);
          if (!isNaN(parsedDate.getTime())) {
            if (lastTag === 'BIRT') currentIndi.birthDate = parsedDate;
            else if (lastTag === 'DEAT') currentIndi.deathDate = parsedDate;
          }
        } else if (tagOrXref === 'PLAC' && lastTag === 'BIRT') {
          currentIndi.birthPlace = rest;
        } else if (tagOrXref === 'OCCU') {
          currentIndi.occupation = rest;
        } else if (tagOrXref === 'NOTE') {
          currentIndi.bio = rest;
        } else if (tagOrXref === 'FAMC') {
          currentIndi.famc = rest;
        } else if (tagOrXref === 'FAMS') {
          currentIndi.fams.push(rest);
        }
      } else if (currentContext === 'FAM' && currentFam) {
        if (tagOrXref === 'HUSB') {
          currentFam.husbandId = rest;
        } else if (tagOrXref === 'WIFE') {
          currentFam.wifeId = rest;
        } else if (tagOrXref === 'CHIL') {
          currentFam.children.push(rest);
        }
      }
    }

    if (currentIndi) indiMap.set(currentIndi.id, currentIndi);
    if (currentFam) famMap.set(currentFam.id, currentFam);

    // Save parsed entities into database
    let importedPersonCount = 0;
    let importedRelCount = 0;
    const gedcomToDbPersonId = new Map<string, string>();

    // 1. Upsert Persons
    for (const [xref, indi] of indiMap.entries()) {
      try {
        const person = await this.prisma.person.create({
          data: {
            firstName: indi.firstName || 'Unknown',
            lastName: indi.lastName || '',
            gender: indi.gender,
            dateOfBirth: indi.birthDate || null,
            dateOfDeath: indi.deathDate || null,
            isAlive: indi.isAlive,
            birthPlace: indi.birthPlace || null,
            occupation: indi.occupation || null,
            bio: indi.bio || `Imported via GEDCOM 5.5.1 standard`,
          },
        });

        gedcomToDbPersonId.set(xref, person.id);

        // Add to family membership
        await this.prisma.familyMember.create({
          data: {
            familyId: family.id,
            personId: person.id,
            role: 'MEMBER',
          },
        });

        importedPersonCount++;
      } catch (err: any) {
        this.logger.warn(`Failed to insert GEDCOM individual ${xref}: ${err.message}`);
      }
    }

    // 2. Ensure Relationship Types exist
    let parentChildType = await this.prisma.relationshipType.findFirst({
      where: { code: 'PARENT_CHILD' },
    });
    if (!parentChildType) {
      parentChildType = await this.prisma.relationshipType.create({
        data: {
          code: 'PARENT_CHILD',
          name: 'Parent - Child',
          category: 'BIOLOGICAL',
        },
      });
    }

    let spouseType = await this.prisma.relationshipType.findFirst({
      where: { code: 'SPOUSE' },
    });
    if (!spouseType) {
      spouseType = await this.prisma.relationshipType.create({
        data: {
          code: 'SPOUSE',
          name: 'Spouse / Partner',
          category: 'MARRIAGE',
        },
      });
    }

    // 3. Connect Relationships from FAM records
    for (const [, fam] of famMap.entries()) {
      const husbDbId = fam.husbandId ? gedcomToDbPersonId.get(fam.husbandId) : undefined;
      const wifeDbId = fam.wifeId ? gedcomToDbPersonId.get(fam.wifeId) : undefined;

      // Link Spouses
      if (husbDbId && wifeDbId && spouseType) {
        try {
          await this.prisma.relationship.upsert({
            where: {
              familyId_fromPersonId_toPersonId_relationshipTypeId: {
                familyId: family.id,
                fromPersonId: husbDbId,
                toPersonId: wifeDbId,
                relationshipTypeId: spouseType.id,
              },
            },
            create: {
              familyId: family.id,
              fromPersonId: husbDbId,
              toPersonId: wifeDbId,
              relationshipTypeId: spouseType.id,
              status: 'ACTIVE',
              createdBy: userId || family.createdBy || 'system',
            },
            update: {},
          });
          importedRelCount++;
        } catch (e: any) {
          this.logger.debug(`Spouse relationship exists or duplicate: ${e.message}`);
        }
      }

      // Link Parents to Children
      const parents = [husbDbId, wifeDbId].filter(Boolean) as string[];
      for (const childXref of fam.children) {
        const childDbId = gedcomToDbPersonId.get(childXref);
        if (childDbId && parentChildType) {
          for (const parentDbId of parents) {
            try {
              await this.prisma.relationship.upsert({
                where: {
                  familyId_fromPersonId_toPersonId_relationshipTypeId: {
                    familyId: family.id,
                    fromPersonId: parentDbId,
                    toPersonId: childDbId,
                    relationshipTypeId: parentChildType.id,
                  },
                },
                create: {
                  familyId: family.id,
                  fromPersonId: parentDbId,
                  toPersonId: childDbId,
                  relationshipTypeId: parentChildType.id,
                  status: 'ACTIVE',
                  createdBy: userId || family.createdBy || 'system',
                },
                update: {},
              });
              importedRelCount++;
            } catch (e: any) {
              this.logger.debug(`Parent-child relationship exists or duplicate: ${e.message}`);
            }
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully imported ${importedPersonCount} family relatives and ${importedRelCount} genealogical connections from GEDCOM.`,
      familyId: family.id,
      familyName: family.name,
      importedPersons: importedPersonCount,
      importedRelationships: importedRelCount,
    };
  }
}
