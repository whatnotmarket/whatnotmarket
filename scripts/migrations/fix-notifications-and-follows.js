const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string using the pooler (us-east-1 as discovered earlier)
const connectionString = 'postgres://postgres.gvjtelbweolrpzpxwqem:29Aprile2002!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const client = new Client({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to database to fix notifications table...');
    await client.connect();
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260306100000_notifications_system.sql');
    console.log(`Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration to create notifications table...');
    await client.query(sql);
    
    console.log('Notifications table created successfully.');

    // Now re-run the follows migration because it might have failed partially
    const followMigrationPath = path.join(__dirname, '../supabase/migrations/20260308150000_fix_follows_and_notifications.sql');
    console.log(`Reading follow migration file: ${followMigrationPath}`);
    const followSql = fs.readFileSync(followMigrationPath, 'utf8');
    
    console.log('Executing follow migration...');
    await client.query(followSql);
    console.log('Follow migration applied successfully.');

  } catch (err) {
    console.error('Error applying migrations:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
