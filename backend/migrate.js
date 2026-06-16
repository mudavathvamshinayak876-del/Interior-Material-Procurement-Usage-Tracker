const { Client } = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');

const pgUrl = process.argv[2];
if (!pgUrl) {
  console.error('Usage: node migrate.js <Aiven-PostgreSQL-Connection-URI>');
  process.exit(1);
}

// Disable TLS verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbPath = path.join(__dirname, 'glory_simon.db');
console.log('Reading local SQLite database from:', dbPath);
const sqliteDb = new sqlite3.Database(dbPath);

const pgClient = new Client({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await pgClient.connect();
  console.log('Connected to Aiven PostgreSQL database.');

  // 1. Fix schema mismatch in PostgreSQL (add assigned_engineer_id if missing)
  console.log('Ensuring projects schema is fully compatible (adding assigned_engineer_id if missing)...');
  await pgClient.query(`
    ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS assigned_engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  const tables = [
    { name: 'users', sequence: 'users_id_seq' },
    { name: 'projects', sequence: 'projects_id_seq' },
    { name: 'suppliers', sequence: 'suppliers_id_seq' },
    { name: 'materials', sequence: 'materials_id_seq' },
    { name: 'invoices', sequence: 'invoices_id_seq' },
    { name: 'notifications', sequence: 'notifications_id_seq' },
    { name: 'audit_logs', sequence: 'audit_logs_id_seq' },
    { name: 'workers', sequence: 'workers_id_seq' },
    { name: 'work_assignments', sequence: 'work_assignments_id_seq' }
  ];

  // 2. Truncate remote tables in reverse dependency order
  console.log('Clearing existing remote PostgreSQL tables to prevent duplicate keys...');
  await pgClient.query('TRUNCATE TABLE work_assignments, workers, audit_logs, notifications, invoices, materials, suppliers, projects, users CASCADE;');

  // Helper to query SQLite
  const sqliteQuery = (sql) => new Promise((resolve, reject) => {
    sqliteDb.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // 3. Migrate tables
  for (const table of tables) {
    console.log(`Migrating table ${table.name}...`);
    const rows = await sqliteQuery(`SELECT * FROM ${table.name}`);
    if (rows.length === 0) {
      console.log(`Table ${table.name} is empty. Skipping.`);
      continue;
    }

    // Get column names
    const columns = Object.keys(rows[0]);
    const columnsJoined = columns.map(col => `"${col}"`).join(', ');
    
    // Insert rows into PG
    for (const row of rows) {
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => {
        // Map empty/null values properly
        if (row[col] === undefined) return null;
        return row[col];
      });
      
      const insertSql = `INSERT INTO ${table.name} (${columnsJoined}) VALUES (${placeholders})`;
      await pgClient.query(insertSql, values);
    }
    console.log(`Successfully migrated ${rows.length} rows to ${table.name}.`);

    // Reset PostgreSQL sequence to prevent future auto-increment ID collisions
    await pgClient.query(`SELECT setval('${table.sequence}', (SELECT COALESCE(MAX(id), 1) FROM ${table.name}));`);
  }

  console.log('\nMigration completed successfully! Your Vercel frontend will now display your localhost database data.');
  sqliteDb.close();
  await pgClient.end();
}

run().catch(err => {
  console.error('\nMigration failed:', err);
  sqliteDb.close();
  pgClient.end();
  process.exit(1);
});
