import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationTypeDto {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export class CreateConversationDto {
  @ApiProperty({ description: 'Recipient user ID for direct 1-on-1 chat' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiPropertyOptional({ description: 'Optional initial message to kick off the thread' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Message body text' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Optional attachment or media URL' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class TypingEventDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Whether the user is typing' })
  isTyping: boolean;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;
}

export class UpdateChatMessageDto {
  @ApiProperty({ description: 'Updated message text content' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Optional updated media URL' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
