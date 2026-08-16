export class CreateUserDto {
  email: string;
  fullName: string;
  password?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

