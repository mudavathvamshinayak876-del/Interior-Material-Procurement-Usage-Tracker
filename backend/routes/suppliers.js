const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM suppliers ORDER BY supplier_name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch suppliers error:', err);
    res.status(500).json({ message: 'Failed to fetch suppliers.' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }
    
    // Add delivery history and invoices linked to this supplier
    const invoices = await db.query('SELECT * FROM invoices WHERE supplier_id = $1 ORDER BY date DESC', [id]);
    const materials = await db.query(`
      SELECT m.*, p.project_name 
      FROM materials m 
      JOIN projects p ON m.project_id = p.id 
      WHERE m.supplier_id = $1 
      ORDER BY m.order_date DESC
    `, [id]);
    
    const supplierDetails = {
      ...rows[0],
      invoices: invoices.rows,
      deliveries: materials.rows
    };

    res.json(supplierDetails);
  } catch (err) {
    console.error('Fetch supplier details error:', err);
    res.status(500).json({ message: 'Failed to fetch supplier details.' });
  }
});

// POST /api/suppliers
router.post('/', authenticateToken, authorizeRoles('admin', 'project_manager', 'vendor_coordinator'), async (req, res) => {
  const { supplier_name, contact_person, phone, email, gst_number, address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({ message: 'Supplier name is required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO suppliers (supplier_name, contact_person, phone, email, gst_number, address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [supplier_name, contact_person || '', phone || '', email || '', gst_number || '', address || '']
    );

    await db.writeAuditLog(req.user.id, 'Supplier Added', `Supplier '${supplier_name}' was added to system.`);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create supplier error:', err);
    res.status(500).json({ message: 'Failed to add supplier.' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'project_manager', 'vendor_coordinator'), async (req, res) => {
  const { id } = req.params;
  const { supplier_name, contact_person, phone, email, gst_number, address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({ message: 'Supplier name is required.' });
  }

  try {
    const checkSup = await db.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (checkSup.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    const result = await db.query(
      `UPDATE suppliers 
       SET supplier_name = $1, contact_person = $2, phone = $3, email = $4, gst_number = $5, address = $6 
       WHERE id = $7 
       RETURNING *`,
      [supplier_name, contact_person || '', phone || '', email || '', gst_number || '', address || '', id]
    );

    await db.writeAuditLog(req.user.id, 'Supplier Updated', `Supplier ID ${id} ('${supplier_name}') updated.`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update supplier error:', err);
    res.status(500).json({ message: 'Failed to update supplier.' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const checkSup = await db.query('SELECT supplier_name FROM suppliers WHERE id = $1', [id]);
    if (checkSup.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    await db.query('DELETE FROM suppliers WHERE id = $1', [id]);
    await db.writeAuditLog(req.user.id, 'Supplier Deleted', `Supplier ID ${id} ('${checkSup.rows[0].supplier_name}') was deleted.`);

    res.json({ message: `Supplier '${checkSup.rows[0].supplier_name}' has been successfully deleted.` });
  } catch (err) {
    console.error('Delete supplier error:', err);
    res.status(500).json({ message: 'Failed to delete supplier.' });
  }
});

module.exports = router;
