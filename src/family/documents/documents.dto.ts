import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class DocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter documents by category (e.g. Legal Records, Birth Certificate, Historic Photo, Deed)',
    example: 'Legal Records',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class DocumentFileAttachmentDto {
  @ApiProperty({
    description: 'Original name of attachment file',
    example: 'deed_part_1.pdf',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Size in human-readable format',
    example: '2.4 MB',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    description: 'Direct file URL or secure storage link',
    example: 'https://storage.familyroots.io/documents/deed_part_1.pdf',
  })
  @IsString()
  fileUrl: string;
}

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Display name or title of the document',
    example: 'Grandfather Land Deed Certificate',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Category classification',
    example: 'Legal Records',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'File size indicator',
    example: '1.8 MB',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'Primary single file URL',
    example: 'https://storage.familyroots.io/documents/sample.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Multiple file URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  fileUrls?: string[];

  @ApiPropertyOptional({
    description: 'Structured array of file attachments',
    type: [DocumentFileAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  files?: DocumentFileAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Name or email of the uploader',
    example: 'Tariq Rahman',
  })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class CreateMultipleDocumentsDto {
  @ApiProperty({
    description: 'List of documents to upload in a batch',
    type: [CreateDocumentDto],
  })
  @IsArray()
  documents: CreateDocumentDto[];
}
