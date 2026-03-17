const { Client } = require('pg');

const connectionString = 'postgres://postgres:29Aprile2002!@db.gvjtelbweolrpzpxwqem.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    console.log('Checking if follows table exists...');
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'follows'
      );
    `);
    
    console.log('Table exists:', res.rows[0].exists);
  } catch (err) {
    console.error('Error checking table:', err);
  } finally {
    await client.end();
  }
}

run();
