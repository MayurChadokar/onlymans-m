const { Client } = require('pg');
require('dotenv').config();

async function run() {
  console.log("Direct URL:", process.env.DIRECT_URL);
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });
  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

run();
