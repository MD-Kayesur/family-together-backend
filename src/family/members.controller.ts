import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Members')
@Controller('family/members')
export class MembersController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all family members in the sanctuary' })
  getMembers() {
    return this.familyService.getMembers();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search and suggest existing family member profiles for deduplication' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term for member name or details' })
  searchMembers(@Query('q') query: string) {
    return this.familyService.searchMembers(query || '');
  }

  @Post()
  @ApiOperation({ summary: 'Add a new family member or link an existing profile with optional platform credentials' })
  createMember(
    @Body()
    body: {
      existingPersonId?: string;
      firstName: string;
      lastName: string;
      email?: string;
      password?: string;
      gender?: string;
      bio?: string;
      roleInFamily?: string;
      middleName?: string;
      nickname?: string;
      dob?: string;
      birthplace?: string;
      isDeceased?: boolean;
      dateOfPassing?: string;
      occupation?: string;
      location?: string;
      contactInfo?: string;
      avatarUrl?: string;
      relativeToPersonId?: string;
      relationshipType?: string;
    },
  ) {
    return this.familyService.createMember(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a family member profile' })
  @ApiParam({ name: 'id', description: 'Unique member / person identifier' })
  updateMember(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; bio?: string },
  ) {
    return this.familyService.updateMember(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a family member from sanctuary' })
  @ApiParam({ name: 'id', description: 'Unique member / person identifier' })
  deleteMember(@Param('id') id: string) {
    return this.familyService.deleteMember(id);
  }
}
