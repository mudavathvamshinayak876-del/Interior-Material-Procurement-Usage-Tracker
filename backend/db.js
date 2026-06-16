// Database Abstraction Layer for Glory Simon Interiors
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const sqlite3 = require('sqlite3');

require('dotenv').config();

let dbClient = null;
let isPostgres = false;

// Determine connection details
const usePg = process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD);

if (usePg) {
  console.log('Database Configuration: PostgreSQL detected. Connecting...');
  const poolConfig = {};
  if (process.env.DATABASE_URL) {
    try {
      const { URL } = require('url');
      const parsedUrl = new URL(process.env.DATABASE_URL);
      parsedUrl.searchParams.delete('sslmode');
      poolConfig.connectionString = parsedUrl.toString();
    } catch (e) {
      poolConfig.connectionString = process.env.DATABASE_URL;
    }
  } else {
    poolConfig.host = process.env.PGHOST;
    poolConfig.user = process.env.PGUSER;
    poolConfig.password = process.env.PGPASSWORD;
    poolConfig.database = process.env.PGDATABASE;
    poolConfig.port = process.env.PGPORT || 5432;
  }
  poolConfig.ssl = process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false };

  const pool = new pg.Pool(poolConfig);
  dbClient = pool;
  isPostgres = true;
  initializePostgres(pool);
} else {
  console.log('Database Configuration: PostgreSQL credentials not found. Falling back to local SQLite database...');
  const dbPath = path.join(__dirname, 'glory_simon.db');
  const dbExists = fs.existsSync(dbPath);
  
  const sqliteDb = new sqlite3.Database(dbPath);
  sqliteDb.run('PRAGMA foreign_keys = ON;');
  
  dbClient = sqliteDb;
  isPostgres = false;

  if (!dbExists) {
    console.log('Initializing local SQLite database with schemas and seeds...');
    initializeSQLite(sqliteDb);
  }
}

// Function to initialize PostgreSQL schema and seeds
async function initializePostgres(pool) {
  try {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    const exists = res.rows[0].exists;
    if (!exists) {
      console.log('PostgreSQL: Users table not found. Initializing schema and seed data...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('PostgreSQL database successfully initialized and seeded.');
      } else {
        console.error('PostgreSQL Schema file not found at:', schemaPath);
      }
    } else {
      console.log('PostgreSQL: Schema already exists. Skipping initialization.');
    }
  } catch (err) {
    console.error('Failed to initialize PostgreSQL database:', err);
  }
}

// Function to initialize SQLite schema and seeds
function initializeSQLite(db) {
  db.serialize(() => {
    // Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'site_engineer', 'vendor_coordinator')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Projects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        address TEXT,
        budget REAL NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'suspended')),
        assigned_engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Suppliers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Materials Table
    db.run(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        material_name TEXT NOT NULL,
        category TEXT NOT NULL,
        ordered_qty REAL NOT NULL DEFAULT 0.00,
        received_qty REAL NOT NULL DEFAULT 0.00,
        used_qty REAL NOT NULL DEFAULT 0.00,
        wasted_qty REAL NOT NULL DEFAULT 0.00,
        remaining_qty REAL NOT NULL DEFAULT 0.00,
        unit_cost REAL NOT NULL DEFAULT 0.00,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        order_date TEXT,
        status TEXT DEFAULT 'ordered',
        invoice_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Invoices Table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        invoice_number TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0.00,
        date TEXT,
        file_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Notifications Table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Audit Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Workers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        trade TEXT NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Work Assignments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS work_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
        task_description TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seeds
    // Passwords are hashed versions of: 'password123'
    db.run(`INSERT INTO users (name, email, password_hash, role) VALUES 
      ('Glory Simon', 'admin@glorysimon.com', '$2a$10$FGC5rpD2S5gMI3B1ONq9AuRxTgcIEfgcirGUZPBI3lmMXGpuG7GsC', 'admin'),
      ('Michael Vance', 'pm@glorysimon.com', '$2a$10$FGC5rpD2S5gMI3B1ONq9AuRxTgcIEfgcirGUZPBI3lmMXGpuG7GsC', 'project_manager'),
      ('David Miller', 'engineer@glorysimon.com', '$2a$10$FGC5rpD2S5gMI3B1ONq9AuRxTgcIEfgcirGUZPBI3lmMXGpuG7GsC', 'site_engineer'),
      ('Sarah Conner', 'vendor@glorysimon.com', '$2a$10$FGC5rpD2S5gMI3B1ONq9AuRxTgcIEfgcirGUZPBI3lmMXGpuG7GsC', 'vendor_coordinator')
    `);

    db.run(`INSERT INTO suppliers (supplier_name, contact_person, phone, email, gst_number, address) VALUES
      ('Premium Ply & Timber', 'Rajesh Kumar', '9876543210', 'sales@premiumply.com', '29AAAAA1111A1Z1', '12 Industrial Area, Bangalore'),
      ('Apex Glass & Hardware', 'Amit Shah', '8765432109', 'info@apexglass.com', '29BBBBB2222B2Z2', '45 Market Road, Bangalore'),
      ('Luxury Stone & Tiles', 'Vikas Reddy', '7654321098', 'support@luxurystone.com', '29CCCCC3333C3Z3', '88 Highway Layout, Bangalore')
    `);

    db.run(`INSERT INTO projects (project_name, client_name, address, budget, status, assigned_engineer_id, start_date, end_date) VALUES
      ('Indiranagar Villa', 'Rohan Mehra', '456, 12th Main, Indiranagar, Bangalore', 7500000.00, 'active', 3, '2026-05-01', '2026-10-31'),
      ('Whitefield Penthouse', 'Preeti Sharma', 'Block C, Prestige Shantiniketan, Whitefield', 4500000.00, 'active', 3, '2026-06-01', '2026-12-15'),
      ('Koramangala Office Space', 'Innovate Tech', '3rd Floor, Sigma Tech Park, Koramangala', 12000000.00, 'planning', NULL, '2026-08-01', '2026-12-31')
    `);

    db.run(`INSERT INTO materials (project_id, material_name, category, ordered_qty, received_qty, used_qty, wasted_qty, remaining_qty, unit_cost, supplier_id, order_date, status) VALUES
      (1, 'Teak Wood Plywood 18mm', 'Plywood', 150, 150, 100, 18, 32, 2200.00, 1, '2026-05-05', 'received'),
      (1, 'Premium Matte Laminate (White)', 'Laminates', 80, 80, 60, 5, 15, 1200.00, 1, '2026-05-06', 'received'),
      (1, 'Toughened Glass 12mm', 'Glass', 25, 20, 15, 4, 1, 3500.00, 2, '2026-05-10', 'received'),
      (2, 'Italian Marble - Botticino', 'Stone', 2000, 1800, 1200, 320, 280, 450.00, 3, '2026-06-02', 'received'),
      (2, 'Stainless Steel Handles 6 inch', 'Hardware', 300, 300, 150, 0, 150, 150.00, 2, '2026-06-05', 'received'),
      (1, 'Charcoal Wall Panels', 'Panels', 50, 0, 0, 0, 0, 1800.00, 1, '2026-06-10', 'ordered')
    `);

    db.run(`INSERT INTO invoices (project_id, supplier_id, invoice_number, amount, date, file_url, status) VALUES
      (1, 1, 'INV-2026-001', 330000.00, '2026-05-05', '', 'paid'),
      (1, 2, 'INV-2026-002', 70000.00, '2026-05-10', '', 'paid'),
      (2, 3, 'INV-2026-003', 900000.00, '2026-06-02', '', 'pending')
    `);

    db.run(`INSERT INTO notifications (user_id, message, type, status) VALUES
      (1, 'Indiranagar Villa: Plywood wastage (18 sheets) has reached 12%, exceeding normal thresholds.', 'excess_wastage', 'unread'),
      (2, 'Whitefield Penthouse: Botticino Marble wastage has reached 17.7%, generating alerts.', 'excess_wastage', 'unread'),
      (4, 'Missing invoice file for Toughened Glass order from Apex Glass & Hardware.', 'missing_invoice', 'unread'),
      (3, 'Low Inventory Alert: Remaining Toughened Glass is only 1 unit.', 'low_inventory', 'unread')
    `);

    db.run(`INSERT INTO audit_logs (user_id, action, details) VALUES
      (1, 'System Setup', 'Initial seed data initialized and database schemas configured.'),
      (2, 'Project Created', 'Whitefield Penthouse project added successfully.'),
      (3, 'Usage Updated', 'Site Engineer logged usage of 1200 sqft Botticino Marble for Whitefield Penthouse.')
    `);

    db.run(`INSERT INTO workers (name, trade, phone, status) VALUES
      ('Ramesh Kumar', 'Painting', '9876543221', 'available'),
      ('Suresh Rao', 'Electrical', '8765432112', 'available'),
      ('John Carpenter', 'Carpentry', '7654321003', 'available'),
      ('Kiran Swamy', 'Plumbing', '6543210994', 'available')
    `);

    db.run(`INSERT INTO work_assignments (project_id, worker_id, task_description, start_date, end_date, status) VALUES
      (1, 1, 'Double coat interior paint in dining room', '2026-06-10', '2026-06-18', 'in_progress'),
      (1, 2, 'Fixing switches and light panels in lobby', '2026-06-12', '2026-06-15', 'completed'),
      (2, 3, 'Wardrobe carcass installation in master bedroom', '2026-06-16', '2026-06-25', 'assigned')
    `);

    console.log('Local SQLite database successfully seeded.');
  });
}

// Unified query wrapper
function query(text, params = []) {
  return new Promise((resolve, reject) => {
    if (isPostgres) {
      dbClient.query(text, params, (err, res) => {
        if (err) return reject(err);
        resolve({ rows: res.rows });
      });
    } else {
      // In SQLite, $1, $2 params are mapped, but SQLite driver uses ?, ?, ? or $1, $2, $3 depending on client.
      // To ensure total compatibility, we convert PG $1, $2 parameters into array parameters for SQLite's run/all.
      // SQLite also supports $1, $2 if mapped as object, but standard ? works perfectly.
      // Let's replace $1, $2 with ? in sql text.
      let sqliteText = text;
      // Replace $N with ? for SQLite compatibility
      sqliteText = sqliteText.replace(/\$\d+/g, '?');

      // Check if it is a SELECT query or a write query
      const trimmedText = sqliteText.trim().toLowerCase();
      if (trimmedText.startsWith('select') || (trimmedText.includes('returning') && !trimmedText.startsWith('insert') && !trimmedText.startsWith('update') && !trimmedText.startsWith('delete'))) {
        dbClient.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [] });
        });
      } else if (trimmedText.startsWith('insert') || trimmedText.startsWith('update') || trimmedText.startsWith('delete')) {
        // SQLite support for RETURNING clause:
        // Node-sqlite3's db.all is fully capable of running INSERT ... RETURNING and returns the rows!
        // We will use db.all for these write queries if they contain RETURNING, otherwise db.run.
        if (trimmedText.includes('returning')) {
          dbClient.all(sqliteText, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [] });
          });
        } else {
          dbClient.run(sqliteText, params, function(err) {
            if (err) return reject(err);
            // Return empty rows but attach lastID and changes for write convenience
            resolve({ rows: [{ id: this.lastID }], changes: this.changes });
          });
        }
      } else {
        // Default fallback
        dbClient.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [] });
        });
      }
    }
  });
}

module.exports = {
  query,
  isPostgres,
  writeAuditLog: async (userId, action, details) => {
    try {
      await query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [userId || null, action, details || '']
      );
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
};
