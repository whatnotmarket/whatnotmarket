const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  "postgres://postgres.gvjtelbweolrpzpxwqem:29Aprile2002!@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("Connecting to database...");
    await client.connect();

    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20260310100000_create_global_chat_messages.sql"
    );
    console.log(`Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing migration...");
    await client.query(sql);

    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Error applying migration:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
