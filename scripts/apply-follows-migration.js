const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string from environment variables + inferred structure
const connectionString = 'postgres://postgres:29Aprile2002!@db.gvjtelbweolrpzpxwqem.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260308140000_create_follows_table.sql');
    console.log(`Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
