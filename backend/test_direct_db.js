const { Client } = require('pg');

async function testConnection(url) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Successfully connected to: ${url}`);
    await client.end();
  } catch (err) {
    console.error(`Failed to connect to: ${url}`);
    console.error(err.message);
  }
}

const url = "postgresql://postgres:onlymans74185@db.credmdgnfqdaixgbrpjs.supabase.co:5432/postgres";

testConnection(url);
