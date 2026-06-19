const { Client } = require('pg');

async function testConnection(url) {
  console.log("Testing:", url);
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    console.log("Connected successfully to:", url);
    await client.end();
    return true;
  } catch (err) {
    console.log("Failed:", err.message);
    return false;
  }
}

async function run() {
  const urls = [
    "postgresql://postgres:password@localhost:5432/postgres",
    "postgresql://postgres:password@127.0.0.1:5432/postgres",
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres"
  ];
  for (const url of urls) {
    if (await testConnection(url)) {
      console.log("FOUND WORKING LOCAL DB URL:", url);
      break;
    }
  }
}

run();
