import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateDocumentDto, DocumentsQueryDto } from './documents.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDocumentFiles(
    fileUrl: string | null,
    fallbackName: string,
    fallbackSize: string,
  ): {
    fileUrl: string;
    fileUrls: string[];
    files: Array<{ name: string; size?: string; fileUrl: string }>;
    fileCount: number;
  } {
    const dummyUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    if (!fileUrl) {
      return {
        fileUrl: dummyUrl,
        fileUrls: [dummyUrl],
        files: [{ name: fallbackName, size: fallbackSize, fileUrl: dummyUrl }],
        fileCount: 1,
      };
    }

    try {
      const trimmed = fileUrl.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const files: Array<{ name: string; size?: string; fileUrl: string }> = [];
          const fileUrls: string[] = [];

          parsed.forEach((item, index) => {
            if (typeof item === 'string' && item.length > 0) {
              files.push({
                name: `${fallbackName} (File ${index + 1})`,
                size: fallbackSize,
                fileUrl: item,
              });
              fileUrls.push(item);
            } else if (item && typeof item === 'object' && item.fileUrl) {
              files.push({
                name: item.name || `${fallbackName} (File ${index + 1})`,
                size: item.size || fallbackSize,
                fileUrl: item.fileUrl,
              });
              fileUrls.push(item.fileUrl);
            }
          });

          if (files.length > 0) {
            return {
              fileUrl: files[0].fileUrl,
              fileUrls,
              files,
              fileCount: files.length,
            };
          }
        }
      }
    } catch {
      // Not a JSON string, fallback to single URL
    }

    return {
      fileUrl: fileUrl,
      fileUrls: [fileUrl],
      files: [{ name: fallbackName, size: fallbackSize, fileUrl }],
      fileCount: 1,
    };
  }

  async getDocuments(query?: DocumentsQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { uploadedBy: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    const sortField = query?.sortBy || 'createdAt';
    const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortDir };

    const total = await this.prisma.document.count({ where });

    const mapDoc = (doc: any) => {
      const parsed = this.parseDocumentFiles(doc.fileUrl, doc.name, doc.size);
      return {
        ...doc,
        fileUrl: parsed.fileUrl,
        fileUrls: parsed.fileUrls,
        files: parsed.files,
        fileCount: parsed.fileCount,
      };
    };

    if (query?.raw === true || query?.paginate === false) {
      const docs = await this.prisma.document.findMany({ where, orderBy });
      return docs.map(mapDoc);
    }

    const docs = await this.prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    return buildPaginatedResponse(docs.map(mapDoc), total, page, limit);
  }

  async createDocument(data: CreateDocumentDto) {
    try {
      const family = await this.prisma.family.findFirst();
      let storedFileUrl = data.fileUrl;

      if (Array.isArray(data.files) && data.files.length > 0) {
        storedFileUrl = JSON.stringify(data.files);
      } else if (Array.isArray(data.fileUrls) && data.fileUrls.length > 0) {
        storedFileUrl = JSON.stringify(data.fileUrls);
      }

      const created = await this.prisma.document.create({
        data: {
          familyId: family?.id || 'default',
          name: data.name,
          category: data.category || 'General',
          size: data.size || '1.0 MB',
          fileUrl: storedFileUrl,
          uploadedBy: data.uploadedBy || 'Family Member',
        },
      });

      const parsed = this.parseDocumentFiles(created.fileUrl, created.name, created.size);
      return {
        ...created,
        fileUrl: parsed.fileUrl,
        fileUrls: parsed.fileUrls,
        files: parsed.files,
        fileCount: parsed.fileCount,
      };
    } catch (err) {
      console.error('Error in createDocument:', err);
      throw err;
    }
  }

  async createMultipleDocuments(documents: any[]) {
    try {
      const family = await this.prisma.family.findFirst();
      const createdDocs: any[] = [];

      for (const docData of documents) {
        if (!docData || !docData.name) continue;

        let storedFileUrl = docData.fileUrl;
        if (Array.isArray((docData as any).files) && (docData as any).files.length > 0) {
          storedFileUrl = JSON.stringify((docData as any).files);
        } else if (Array.isArray((docData as any).fileUrls) && (docData as any).fileUrls.length > 0) {
          storedFileUrl = JSON.stringify((docData as any).fileUrls);
        }

        try {
          const doc = await Promise.race([
            this.prisma.document.create({
              data: {
                familyId: family?.id || 'default',
                name: docData.name,
                category: docData.category || 'General',
                size: docData.size || '1.0 MB',
                fileUrl: storedFileUrl,
                uploadedBy: docData.uploadedBy || 'Family Member',
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout saving document: ${docData.name}`)), 60000),
            ),
          ]);

          const parsed = this.parseDocumentFiles((doc as any).fileUrl, (doc as any).name, (doc as any).size);
          createdDocs.push({
            ...(doc as any),
            fileUrl: parsed.fileUrl,
            fileUrls: parsed.fileUrls,
            files: parsed.files,
            fileCount: parsed.fileCount,
          });
        } catch (itemErr) {
          console.error(`Error saving individual document ${docData.name}:`, itemErr);
        }
      }

      return createdDocs;
    } catch (err) {
      console.error('Error in createMultipleDocuments:', err);
      throw err;
    }
  }

  async deleteDocument(id: string) {
    try {
      const doc = await this.prisma.document.findUnique({ where: { id } });
      if (!doc) {
        return { success: true, message: 'Document already deleted or not found' };
      }
      await this.prisma.document.delete({
        where: { id },
      });
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: true, message: 'Document already deleted' };
      }
      throw err;
    }
  }

  async deleteAllDocuments() {
    await this.prisma.document.deleteMany({});
    return { success: true, message: 'All documents purged successfully' };
  }
}
