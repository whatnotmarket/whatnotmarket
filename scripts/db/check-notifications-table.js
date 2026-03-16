const { Client } = require('pg');

// Connection string from environment variables + inferred structure
const connectionString = 'postgres://postgres:29Aprile2002!@db.gvjtelbweolrpzpxwqem.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Checking if notifications table exists...');
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    console.log('Table exists:', res.rows[0].exists);

    if (res.rows[0].exists) {
        console.log('Checking columns...');
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications';
        `);
        console.log('Columns:', cols.rows);
    }
    
  } catch (err) {
    console.error('Error checking table:', err);
  } finally {
    await client.end();
  }
}

run();
