import { Controller, Get, Post, Body, Query, Header, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { GedcomService } from './gedcom.service';

@ApiTags('GEDCOM Genealogy Standard')
@Controller('family/gedcom')
export class GedcomController {
  constructor(private readonly gedcomService: GedcomService) {}

  @Get('export')
  @ApiOperation({
    summary: 'Export family tree to standard GEDCOM 5.5.1 format [Roles: ALL]',
    description: `Generates a lineage-linked GEDCOM 5.5.1 genealogical file representing all ancestors, descendants, and relationships in the family sanctuary.`,
  })
  @ApiResponse({ status: 200, description: 'GEDCOM data exported successfully' })
  async exportGedcom(
    @Query('familyId') familyId?: string,
    @Query('userId') userId?: string,
    @Res() res?: Response,
  ) {
    const result = await this.gedcomService.exportGedcom(familyId, userId);
    if (res) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(HttpStatus.OK).send(result.gedcom);
    }
    return result;
  }

  @Get('export-json')
  @ApiOperation({
    summary: 'Export family tree GEDCOM text payload wrapped in JSON [Roles: ALL]',
  })
  async exportGedcomJson(
    @Query('familyId') familyId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.gedcomService.exportGedcom(familyId, userId);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import family tree from standard GEDCOM 5.5.1 payload [Roles: OWNER, ADMIN]',
    description: `Parses GEDCOM 5.5.1 individual and family blocks and inserts them into the sanctuary database.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        gedcom: { type: 'string', description: 'Raw GEDCOM 5.5.1 text content' },
        familyId: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['gedcom'],
    },
  })
  @ApiResponse({ status: 200, description: 'GEDCOM imported successfully' })
  async importGedcom(
    @Body() body: { gedcom: string; familyId?: string; userId?: string },
  ) {
    return this.gedcomService.importGedcom(body.gedcom, body.familyId, body.userId);
  }
}
