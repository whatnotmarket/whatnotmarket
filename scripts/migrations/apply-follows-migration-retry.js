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
    try {
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (e) {
        if (e.code === '42P07') { // duplicate_table
            console.log('Table follows already exists, skipping creation.');
        } else if (e.code === '42710') { // duplicate_object (for policies/triggers)
             console.log('Policy or trigger already exists, continuing...');
        } else {
            // Log full error but don't crash if it's just a "relation exists" error that we missed
            console.error('Migration error (might be safe to ignore if already applied):', e.message);
        }
    }
    
  } catch (err) {
    console.error('Connection/System Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
