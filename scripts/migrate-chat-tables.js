require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrateChat() {
  await client.connect();
  console.log('Connected to PostgreSQL database for Chat migration');

  const sql = `
    -- 1. Ensure created_by_id on users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(36);

    -- 2. Conversations table
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) PRIMARY KEY,
      family_id VARCHAR(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      type VARCHAR(20) DEFAULT 'DIRECT',
      title VARCHAR(255),
      last_message TEXT,
      last_sender_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_family_id ON conversations(family_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

    -- 3. Conversation Participants table
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      unread_count INTEGER DEFAULT 0,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conv_part_user ON conversation_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_conv_part_conv ON conversation_participants(conversation_id);

    -- 4. Chat Messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_name VARCHAR(255) NOT NULL,
      avatar TEXT,
      text TEXT NOT NULL,
      media_url TEXT,
      reactions JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(20) DEFAULT 'SENT',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
  `;

  await client.query(sql);
  console.log('✅ Chat tables and indexes migrated successfully in PostgreSQL!');
  await client.end();
}

migrateChat().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
