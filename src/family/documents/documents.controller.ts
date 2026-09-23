import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, CreateMultipleDocumentsDto, DocumentsQueryDto } from './documents.dto';

@ApiTags('Documents Archive')
@Controller('family/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get encrypted family documents archive vault with pagination and search [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/documents\`
**Purpose:** Retrieves historical records, certificates, land deeds, identity files, and scanned family heirlooms with category filter, search, and pagination.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to document metadata and secure download URLs.`,
  })
  @ApiResponse({ status: 200, description: 'Documents list retrieved successfully' })
  getDocuments(@Query() query: DocumentsQueryDto) {
    return this.documentsService.getDocuments(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Upload single or batch document(s) to family vault [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/documents\`
**Purpose:** Stores new file attachments (PDFs, images, scans up to 100MB) with category, file size, and uploader tracking.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Authorized family members can contribute historical documents.`,
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  createDocument(
    @Body()
    body: CreateDocumentDto | CreateMultipleDocumentsDto | CreateDocumentDto[],
  ) {
    if (Array.isArray(body)) {
      return this.documentsService.createMultipleDocuments(body);
    }
    if ((body as any)?.documents && Array.isArray((body as any).documents)) {
      return this.documentsService.createMultipleDocuments((body as any).documents);
    }
    return this.documentsService.createDocument(body as CreateDocumentDto);
  }

  @Post('multiple')
  @ApiOperation({
    summary: 'Upload multiple batch documents to family vault [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/documents/multiple\`
**Purpose:** Uploads multi-document bundles in a single atomic request (supporting up to 100MB payload).
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Batch file contribution permission.`,
  })
  @ApiResponse({ status: 201, description: 'Batch documents uploaded successfully' })
  createMultipleDocuments(
    @Body()
    body: CreateMultipleDocumentsDto | CreateDocumentDto[],
  ) {
    const list = Array.isArray(body) ? body : (body as any)?.documents || [];
    return this.documentsService.createMultipleDocuments(list);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a single document from vault [Roles: MEMBER (Uploader), OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/documents/:id\`
**Purpose:** Removes an individual document from the sanctuary repository.
**Allowed Roles:** Document Uploader (\`MEMBER\` / \`USER\`), \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Delete permission restricted to the original uploader or sanctuary owner.`,
  })
  @ApiParam({ name: 'id', description: 'Unique document identifier' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete all documents from family vault [Roles: OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/documents\`
**Purpose:** Purges the entire document archive for the family sanctuary.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\` strictly.
**Permissions:** Destructive purge action requiring sanctuary owner or admin authority. Denied for ordinary members.`,
  })
  @ApiResponse({ status: 200, description: 'All documents purged successfully' })
  deleteAllDocuments() {
    return this.documentsService.deleteAllDocuments();
  }
}
