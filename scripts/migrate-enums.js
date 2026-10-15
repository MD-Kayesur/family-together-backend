require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function createEnums() {
  await client.connect();
  console.log('Connected to PostgreSQL database for Enum creation');

  const sql = `
    DO $$ BEGIN
        CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Alter columns to use the enum types
    ALTER TABLE conversations ALTER COLUMN type DROP DEFAULT;
    ALTER TABLE conversations ALTER COLUMN type TYPE "ConversationType" USING (type::"ConversationType");
    ALTER TABLE conversations ALTER COLUMN type SET DEFAULT 'DIRECT'::"ConversationType";

    ALTER TABLE chat_messages ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE chat_messages ALTER COLUMN status TYPE "MessageStatus" USING (status::"MessageStatus");
    ALTER TABLE chat_messages ALTER COLUMN status SET DEFAULT 'SENT'::"MessageStatus";
  `;

  await client.query(sql);
  console.log('✅ ConversationType and MessageStatus PostgreSQL enums configured successfully!');
  await client.end();
}

createEnums().catch(err => {
  console.error('Enum creation failed:', err);
  process.exit(1);
});
