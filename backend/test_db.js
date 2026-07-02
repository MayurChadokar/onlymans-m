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

const url1 = "postgresql://postgres.credmdgnfqdaixgbrpjs:onlymans74185@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const url2 = "postgresql://postgres.credmdgnfqdaixgbrpjs:onlymans74185@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const url3 = "postgresql://postgres.credmdgnfqdaixgbrpjs:onlymans74185@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
const url4 = "postgresql://postgres.credmdgnfqdaixgbrpjs:onlymans74185@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  await testConnection(url1);
  await testConnection(url2);
  await testConnection(url3);
  await testConnection(url4);
}

run();
