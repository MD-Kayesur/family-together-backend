import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { DocumentsQueryDto } from './dto/family-query.dto';

@ApiTags('Documents Archive')
@Controller('family/documents')
export class DocumentsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get encrypted family documents archive vault with pagination and search',
    description: `**Purpose:** Retrieves historical records, certificates, land deeds, identity files, and scanned family heirlooms with category filter, search, and pagination.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to document metadata and secure download URLs.`,
  })
  @ApiResponse({ status: 200, description: 'Documents list retrieved successfully' })
  getDocuments(@Query() query: DocumentsQueryDto) {
    return this.familyService.getDocuments(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Upload single or batch document(s) to family vault',
    description: `**Purpose:** Stores new file attachments (PDFs, images, scans up to 100MB) with category, file size, and uploader tracking.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Authorized family members can contribute historical documents.`,
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
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
  @ApiOperation({
    summary: 'Upload multiple batch documents to family vault',
    description: `**Purpose:** Uploads multi-document bundles in a single atomic request (supporting up to 100MB payload).
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Batch file contribution permission.`,
  })
  @ApiResponse({ status: 201, description: 'Batch documents uploaded successfully' })
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
  @ApiOperation({
    summary: 'Delete a single document from vault',
    description: `**Purpose:** Removes an individual document from the sanctuary repository.
**Allowed Roles:** Document Uploader, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Delete permission restricted to the original uploader or sanctuary owner.`,
  })
  @ApiParam({ name: 'id', description: 'Unique document identifier' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  deleteDocument(@Param('id') id: string) {
    return this.familyService.deleteDocument(id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete all documents from family vault',
    description: `**Purpose:** Purges the entire document archive for the family sanctuary.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\` strictly.
**Permissions:** Destructive purge action requiring sanctuary owner or admin authority. Denied for ordinary members.`,
  })
  @ApiResponse({ status: 200, description: 'All documents purged successfully' })
  deleteAllDocuments() {
    return this.familyService.deleteAllDocuments();
  }
}
