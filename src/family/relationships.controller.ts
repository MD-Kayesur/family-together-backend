import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Relationships')
@Controller('family/relationships')
export class RelationshipsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get full family relationships graph matrix for tree rendering' })
  getRelationships() {
    return this.familyService.getRelationships();
  }

  @Post()
  @ApiOperation({ summary: 'Create a relationship link between two relatives' })
  createRelationship(
    @Body() body: { fromPersonId: string; toPersonId: string; typeCode?: string },
  ) {
    return this.familyService.createRelationship(body);
  }
}
