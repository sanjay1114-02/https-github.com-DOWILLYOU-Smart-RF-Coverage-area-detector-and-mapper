const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function testDatabase() {
  try {
    const result = await pool.query(
      'SELECT NOW() AS server_time'
    );

    console.log('SUCCESS: PostgreSQL connected!');
    console.log('Database time:', result.rows[0].server_time);
  } catch (error) {
    console.error('Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();