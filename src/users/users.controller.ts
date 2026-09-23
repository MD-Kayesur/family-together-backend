import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user account [Roles: OWNER, ADMIN, SUPER_ADMIN]',
    description: `**Route:** \`POST /users\`
**Purpose:** Creates a new user account with specified role assignment, email, and password in PostgreSQL.
**Required Permissions / Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiResponse({ status: 201, description: 'User account successfully created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve list of all users with pagination and search [Roles: OWNER, ADMIN, SUPER_ADMIN]',
    description: `**Route:** \`GET /users\`
**Purpose:** Retrieves a paginated list of user accounts with multi-field search and role filtering.
**Required Permissions / Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiResponse({ status: 200, description: 'Paginated list of users retrieved successfully' })
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a specific user by ID [Roles: OWNER, ADMIN, SUPER_ADMIN, MEMBER]',
    description: `**Route:** \`GET /users/:id\`
**Purpose:** Looks up user account details, role, status, and metadata by unique identifier.
**Required Permissions / Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, or \`MEMBER\` (Self profile).`,
  })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User record found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile details or role [Roles: OWNER, ADMIN, SUPER_ADMIN]',
    description: `**Route:** \`PATCH /users/:id\`
**Purpose:** Updates user attributes, status (ACTIVE/PENDING/SUSPENDED), or elevated role permissions.
**Required Permissions / Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove user account [Roles: OWNER, ADMIN, SUPER_ADMIN]',
    description: `**Route:** \`DELETE /users/:id\`
**Purpose:** Permanently deletes a user account from PostgreSQL.
**Required Permissions / Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User account removed' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

