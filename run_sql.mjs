#!/usr/bin/env node
/**
 * WFMT SQL Runner — substitute for webdev_execute_sql in any Manus chat
 *
 * Usage (from shell tool in Manus):
 *   node /home/ubuntu/approval_workflow_system/run_sql.mjs "SELECT 1"
 *   node /home/ubuntu/approval_workflow_system/run_sql.mjs "ALTER TABLE doc_sequences ADD COLUMN notes TEXT"
 *
 * Or pipe a .sql file:
 *   node /home/ubuntu/approval_workflow_system/run_sql.mjs "$(cat /home/ubuntu/migration.sql)"
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Make sure you are running this inside the approval_workflow_system project directory.');
  process.exit(1);
}

const sql = process.argv[2];

if (!sql) {
  console.error('Usage: node run_sql.mjs "<SQL statement>"');
  process.exit(1);
}

let connection;
try {
  connection = await mysql.createConnection(DATABASE_URL);
  console.log('Connected to MySQL/TiDB database.');
  console.log('Running SQL:\n', sql, '\n');

  const [rows] = await connection.execute(sql);

  if (Array.isArray(rows) && rows.length > 0) {
    console.log('Result:');
    console.table(rows);
  } else {
    console.log('Success. Rows affected:', rows?.affectedRows ?? 0);
  }
} catch (err) {
  console.error('SQL Error:', err.message);
  process.exit(1);
} finally {
  if (connection) await connection.end();
}
