import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationTypeDto {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation type: DIRECT or GROUP', enum: ConversationTypeDto })
  @IsOptional()
  @IsEnum(ConversationTypeDto)
  type?: ConversationTypeDto;

  @ApiPropertyOptional({ description: 'Recipient user ID for direct 1-on-1 chat' })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiPropertyOptional({ description: 'List of participant user IDs for group chat' })
  @IsOptional()
  @IsArray()
  participantIds?: string[];

  @ApiPropertyOptional({ description: 'Title / name for group chat' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Optional initial message to kick off the thread' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class AddGroupParticipantsDto {
  @ApiProperty({ description: 'List of user IDs to add to the group conversation' })
  @IsNotEmpty()
  @IsArray()
  participantIds: string[];
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
