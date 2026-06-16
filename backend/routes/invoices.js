const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

// Initialize Cloudinary if keys are present
let isCloudinaryConfigured = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
}

// Multer Local Storage Configuration
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only Images (JPG/PNG) and PDFs are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/invoices (supports search/filter)
router.get('/', authenticateToken, async (req, res) => {
  const { search, project_id, supplier_id } = req.query;
  try {
    let queryText = `
      SELECT i.*, p.project_name, s.supplier_name 
      FROM invoices i
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
    `;
    const params = [];
    const conditions = [];

    if (project_id) {
      params.push(project_id);
      conditions.push(`i.project_id = $${params.length}`);
    }

    if (supplier_id) {
      params.push(supplier_id);
      conditions.push(`i.supplier_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(i.invoice_number LIKE $${params.length} OR s.supplier_name LIKE $${params.length})`);
    }

    // Site engineers only see invoices from their assigned projects
    if (req.user.role === 'site_engineer') {
      params.push(req.user.id);
      conditions.push(`p.assigned_engineer_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY i.date DESC';
    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ message: 'Failed to fetch invoices.' });
  }
});

// POST /api/invoices (Upload Invoice file and create record)
// Roles allowed: admin, project_manager, vendor_coordinator
router.post('/', authenticateToken, authorizeRoles('admin', 'project_manager', 'vendor_coordinator'), (req, res) => {
  upload.single('invoice_file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { project_id, supplier_id, invoice_number, amount, date } = req.body;

    if (!project_id || !supplier_id || !invoice_number || !amount || !date) {
      // Remove uploaded file if validation failed
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'All fields (project_id, supplier_id, invoice_number, amount, date) are required.' });
    }

    try {
      let fileUrl = '';

      if (req.file) {
        if (isCloudinaryConfigured) {
          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'glory_simon_invoices'
          });
          fileUrl = uploadResult.secure_url;
          // Delete local temp file
          fs.unlinkSync(req.file.path);
        } else {
          // Serve locally
          fileUrl = `/uploads/${req.file.filename}`;
        }
      }

      const result = await db.query(
        `INSERT INTO invoices (project_id, supplier_id, invoice_number, amount, date, file_url, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
         RETURNING *`,
        [project_id, supplier_id, invoice_number, amount, date, fileUrl]
      );

      const newInvoice = result.rows[0];

      // Check for missing invoices alert resolutions, etc.
      // If we just uploaded an invoice, notify relevant users
      await db.writeAuditLog(
        req.user.id, 
        'Invoice Uploaded', 
        `Uploaded invoice #${invoice_number} from supplier ID ${supplier_id} for amount ${amount}`
      );

      res.status(201).json(newInvoice);
    } catch (dbErr) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Save invoice error:', dbErr);
      res.status(500).json({ message: 'Failed to save invoice record.' });
    }
  });
});

// PUT /api/invoices/:id (update status or details)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'project_manager', 'vendor_coordinator'), async (req, res) => {
  const { id } = req.params;
  const { status, amount, invoice_number, date } = req.body;

  try {
    const checkInv = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (checkInv.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    const current = checkInv.rows[0];
    const newStatus = status || current.status;
    const newAmount = amount !== undefined ? amount : current.amount;
    const newNumber = invoice_number || current.invoice_number;
    const newDate = date || current.date;

    const result = await db.query(
      `UPDATE invoices 
       SET status = $1, amount = $2, invoice_number = $3, date = $4 
       WHERE id = $5 
       RETURNING *`,
      [newStatus, newAmount, newNumber, newDate, id]
    );

    await db.writeAuditLog(
      req.user.id, 
      'Invoice Updated', 
      `Updated invoice ID ${id} (#${newNumber}) to status: ${newStatus}, amount: ${newAmount}`
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ message: 'Failed to update invoice.' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const checkInv = await db.query('SELECT invoice_number, file_url FROM invoices WHERE id = $1', [id]);
    if (checkInv.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    const invoice = checkInv.rows[0];

    // Delete local file if it exists and is served locally
    if (invoice.file_url && invoice.file_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', invoice.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.query('DELETE FROM invoices WHERE id = $1', [id]);
    await db.writeAuditLog(req.user.id, 'Invoice Deleted', `Deleted invoice #${invoice.invoice_number}`);

    res.json({ message: `Invoice #${invoice.invoice_number} has been deleted.` });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ message: 'Failed to delete invoice.' });
  }
});

module.exports = router;
