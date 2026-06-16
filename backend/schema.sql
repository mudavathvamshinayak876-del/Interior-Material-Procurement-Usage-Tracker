-- Database Schema for Glory Simon Interiors Material Tracker (PostgreSQL)

-- Drop tables if they exist (for reset/rebuild)
DROP TABLE IF EXISTS work_assignments CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'project_manager', 'site_engineer', 'vendor_coordinator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    address TEXT,
    budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'suspended')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials Table
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    ordered_qty DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    received_qty DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    used_qty DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    wasted_qty DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remaining_qty DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    order_date DATE,
    status VARCHAR(50) DEFAULT 'ordered',
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    date DATE,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workers Table
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trade VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work Assignments Table
CREATE TABLE work_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (Default Users)
-- Passwords are hashed versions of: 'password123'
INSERT INTO users (name, email, password_hash, role) VALUES
('Glory Simon', 'admin@glorysimon.com', '$2a$10$wKlh2ZtU71j.uQdC791D6.dZ9a1Jp0RjE6w78aLh835rT4D31a69G', 'admin'),
('Michael Vance', 'pm@glorysimon.com', '$2a$10$wKlh2ZtU71j.uQdC791D6.dZ9a1Jp0RjE6w78aLh835rT4D31a69G', 'project_manager'),
('David Miller', 'engineer@glorysimon.com', '$2a$10$wKlh2ZtU71j.uQdC791D6.dZ9a1Jp0RjE6w78aLh835rT4D31a69G', 'site_engineer'),
('Sarah Conner', 'vendor@glorysimon.com', '$2a$10$wKlh2ZtU71j.uQdC791D6.dZ9a1Jp0RjE6w78aLh835rT4D31a69G', 'vendor_coordinator');

-- Seed Data (Suppliers)
INSERT INTO suppliers (supplier_name, contact_person, phone, email, gst_number, address) VALUES
('Premium Ply & Timber', 'Rajesh Kumar', '9876543210', 'sales@premiumply.com', '29AAAAA1111A1Z1', '12 Industrial Area, Bangalore'),
('Apex Glass & Hardware', 'Amit Shah', '8765432109', 'info@apexglass.com', '29BBBBB2222B2Z2', '45 Market Road, Bangalore'),
('Luxury Stone & Tiles', 'Vikas Reddy', '7654321098', 'support@luxurystone.com', '29CCCCC3333C3Z3', '88 Highway Layout, Bangalore');

-- Seed Data (Projects)
INSERT INTO projects (project_name, client_name, address, budget, status, start_date, end_date) VALUES
('Indiranagar Villa', 'Rohan Mehra', '456, 12th Main, Indiranagar, Bangalore', 7500000.00, 'active', '2026-05-01', '2026-10-31'),
('Whitefield Penthouse', 'Preeti Sharma', 'Block C, Prestige Shantiniketan, Whitefield', 4500000.00, 'active', '2026-06-01', '2026-12-15'),
('Koramangala Office Space', 'Innovate Tech', '3rd Floor, Sigma Tech Park, Koramangala', 12000000.00, 'planning', '2026-08-01', '2026-12-31');

-- Seed Data (Materials)
INSERT INTO materials (project_id, material_name, category, ordered_qty, received_qty, used_qty, wasted_qty, remaining_qty, unit_cost, supplier_id, order_date, status) VALUES
(1, 'Teak Wood Plywood 18mm', 'Plywood', 150, 150, 100, 18, 32, 2200.00, 1, '2026-05-05', 'received'),
(1, 'Premium Matte Laminate (White)', 'Laminates', 80, 80, 60, 5, 15, 1200.00, 1, '2026-05-06', 'received'),
(1, 'Toughened Glass 12mm', 'Glass', 25, 20, 15, 4, 1, 3500.00, 2, '2026-05-10', 'received'),
(2, 'Italian Marble - Botticino', 'Stone', 2000, 1800, 1200, 320, 280, 450.00, 3, '2026-06-02', 'received'),
(2, 'Stainless Steel Handles 6 inch', 'Hardware', 300, 300, 150, 0, 150, 150.00, 2, '2026-06-05', 'received'),
(1, 'Charcoal Wall Panels', 'Panels', 50, 0, 0, 0, 0, 1800.00, 1, '2026-06-10', 'ordered');

-- Seed Data (Invoices)
INSERT INTO invoices (project_id, supplier_id, invoice_number, amount, date, file_url, status) VALUES
(1, 1, 'INV-2026-001', 330000.00, '2026-05-05', '', 'paid'),
(1, 2, 'INV-2026-002', 70000.00, '2026-05-10', '', 'paid'),
(2, 3, 'INV-2026-003', 900000.00, '2026-06-02', '', 'pending');

-- Seed Data (Notifications)
INSERT INTO notifications (user_id, message, type, status) VALUES
(1, 'Indiranagar Villa: Plywood wastage (18 sheets) has reached 12%, exceeding normal thresholds.', 'excess_wastage', 'unread'),
(2, 'Whitefield Penthouse: Botticino Marble wastage has reached 17.7%, generating alerts.', 'excess_wastage', 'unread'),
(4, 'Missing invoice file for Toughened Glass order from Apex Glass & Hardware.', 'missing_invoice', 'unread'),
(3, 'Low Inventory Alert: Remaining Toughened Glass is only 1 unit.', 'low_inventory', 'unread');

-- Seed Data (Audit Logs)
INSERT INTO audit_logs (user_id, action, details) VALUES
(1, 'System Setup', 'Initial seed data initialized and database schemas configured.'),
(2, 'Project Created', 'Whitefield Penthouse project added successfully.'),
(3, 'Usage Updated', 'Site Engineer logged usage of 1200 sqft Botticino Marble for Whitefield Penthouse.');

-- Seed Data (Workers)
INSERT INTO workers (name, trade, phone, status) VALUES
('Ramesh Kumar', 'Painting', '9876543221', 'available'),
('Suresh Rao', 'Electrical', '8765432112', 'available'),
('John Carpenter', 'Carpentry', '7654321003', 'available'),
('Kiran Swamy', 'Plumbing', '6543210994', 'available');

-- Seed Data (Work Assignments)
INSERT INTO work_assignments (project_id, worker_id, task_description, start_date, end_date, status) VALUES
(1, 1, 'Double coat interior paint in dining room', '2026-06-10', '2026-06-18', 'in_progress'),
(1, 2, 'Fixing switches and light panels in lobby', '2026-06-12', '2026-06-15', 'completed'),
(2, 3, 'Wardrobe carcass installation in master bedroom', '2026-06-16', '2026-06-25', 'assigned');
