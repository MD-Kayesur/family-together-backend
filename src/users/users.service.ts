import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { buildPaginatedResponse } from '../common/interfaces/paginated-result.interface';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: any) {
    const { password, email, ...rest } = createUserDto;
    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      throw new BadRequestException('Email address is required.');
    }

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        `A user account with email "${normalizedEmail}" already exists.`,
      );
    }

    const plainPassword = password || 'SanctuaryPass123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...rest,
          email: normalizedEmail,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });

      // Send email with credentials/welcome info to valid email address
      if (user.email) {
        this.mailService
          .sendMemberWelcomeEmail(user.email, user.fullName, user.email, plainPassword)
          .catch((err) => console.error('Failed to send user welcome email:', err));
      }

      return user;
    } catch (error: any) {
      if (
        error?.code === 'P2002' ||
        error?.message?.includes('Unique constraint failed') ||
        error?.message?.includes('duplicate key')
      ) {
        throw new ConflictException(
          `A user account with email "${normalizedEmail}" already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(query?: UsersQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.role) {
      where.role = query.role.toUpperCase() as any;
    }

    if (query?.status) {
      where.status = query.status.toUpperCase() as any;
    }

    const sortField = query?.sortBy || 'createdAt';
    const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortDir };

    const select = {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      phoneNumber: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    };

    const total = await this.prisma.user.count({ where });

    if (query?.raw === true || query?.paginate === false) {
      return this.prisma.user.findMany({ where, select, orderBy });
    }

    const users = await this.prisma.user.findMany({
      where,
      select,
      skip,
      take: limit,
      orderBy,
    });

    return buildPaginatedResponse(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = { ...updateUserDto };
    if (data.email) {
      data.email = data.email.trim().toLowerCase();
      const existingWithEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new ConflictException(
          `A user account with email "${data.email}" already exists.`,
        );
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    if (data.role && typeof data.role === 'string') {
      data.role = data.role.toUpperCase();
    }

    if (data.status && typeof data.status === 'string') {
      data.status = data.status.toUpperCase();
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });
    } catch (error: any) {
      if (
        error?.code === 'P2002' ||
        error?.message?.includes('Unique constraint failed') ||
        error?.message?.includes('duplicate key')
      ) {
        throw new ConflictException(
          `A user account with email "${data.email || 'provided'}" already exists.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'User removed successfully' };
  }
}


