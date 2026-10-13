require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL database');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(36) PRIMARY KEY,
      family_id VARCHAR(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      sender_user_id VARCHAR(36) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      total_recipients INTEGER DEFAULT 0,
      successful_sent INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      target_role VARCHAR(50) DEFAULT 'ALL',
      reply_to_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_family_id ON announcements(family_id);
    CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
  `;

  await client.query(createTableSql);
  console.log('✅ announcements table & indexes created/verified successfully in PostgreSQL!');
  await client.end();
}

migrate().catch(console.error);
