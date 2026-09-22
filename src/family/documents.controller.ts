import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Documents Archive')
@Controller('family/documents')
export class DocumentsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get encrypted family documents archive vault' })
  getDocuments() {
    return this.familyService.getDocuments();
  }

  @Post()
  @ApiOperation({ summary: 'Upload single or batch document(s) to family vault' })
  createDocument(
    @Body()
    body:
      | {
          name: string;
          category?: string;
          size?: string;
          fileUrl?: string;
          fileUrls?: string[];
          files?: Array<{ name: string; size?: string; fileUrl: string }>;
          uploadedBy?: string;
        }
      | { documents: Array<{ name: string; category?: string; size?: string; fileUrl?: string; files?: any[]; uploadedBy?: string }> }
      | Array<{ name: string; category?: string; size?: string; fileUrl?: string; files?: any[]; uploadedBy?: string }>,
  ) {
    if (Array.isArray(body)) {
      return this.familyService.createMultipleDocuments(body);
    }
    if ((body as any)?.documents && Array.isArray((body as any).documents)) {
      return this.familyService.createMultipleDocuments((body as any).documents);
    }
    return this.familyService.createDocument(body as any);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple batch documents to family vault' })
  createMultipleDocuments(
    @Body()
    body:
      | { documents: Array<{ name: string; category?: string; size?: string; fileUrl?: string; uploadedBy?: string }> }
      | Array<{ name: string; category?: string; size?: string; fileUrl?: string; uploadedBy?: string }>,
  ) {
    const list = Array.isArray(body) ? body : (body as any)?.documents || [];
    return this.familyService.createMultipleDocuments(list);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single document from vault' })
  @ApiParam({ name: 'id', description: 'Unique document identifier' })
  deleteDocument(@Param('id') id: string) {
    return this.familyService.deleteDocument(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all documents from family vault' })
  deleteAllDocuments() {
    return this.familyService.deleteAllDocuments();
  }
}
