const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper to convert array of objects to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val === null || val === undefined ? '' : val)).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

// GET /api/reports/consumption
router.get('/consumption', authenticateToken, async (req, res) => {
  const { project_id, export_csv } = req.query;
  try {
    let queryText = `
      SELECT p.project_name, m.material_name, m.category, m.ordered_qty, m.received_qty, m.used_qty, m.unit_cost,
             (m.received_qty * m.unit_cost) as total_cost,
             s.supplier_name
      FROM materials m
      JOIN projects p ON m.project_id = p.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
    `;
    const conditions = [];
    const params = [];
    if (project_id) {
      params.push(project_id);
      conditions.push(`m.project_id = $${params.length}`);
    }
    if (req.user.role === 'site_engineer') {
      params.push(req.user.id);
      conditions.push(`p.assigned_engineer_id = $${params.length}`);
    }
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    queryText += ' ORDER BY p.project_name, m.material_name';

    const { rows } = await db.query(queryText, params);

    if (export_csv === 'true') {
      const csv = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=material_consumption_report.csv');
      return res.send(csv);
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch consumption report error:', err);
    res.status(500).json({ message: 'Failed to generate consumption report.' });
  }
});

// GET /api/reports/wastage
router.get('/wastage', authenticateToken, async (req, res) => {
  const { project_id, export_csv } = req.query;
  try {
    let queryText = `
      SELECT p.project_name, m.material_name, m.category, m.received_qty, m.used_qty, m.wasted_qty, m.remaining_qty,
             CASE 
               WHEN m.received_qty > 0 THEN ROUND((m.wasted_qty / m.received_qty) * 100, 2)
               ELSE 0.00
             END as wastage_percentage,
             (m.wasted_qty * m.unit_cost) as wastage_cost
      FROM materials m
      JOIN projects p ON m.project_id = p.id
    `;
    const conditions = [];
    const params = [];
    if (project_id) {
      params.push(project_id);
      conditions.push(`m.project_id = $${params.length}`);
    }
    if (req.user.role === 'site_engineer') {
      params.push(req.user.id);
      conditions.push(`p.assigned_engineer_id = $${params.length}`);
    }
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    queryText += ' ORDER BY wastage_percentage DESC';

    const { rows } = await db.query(queryText, params);

    if (export_csv === 'true') {
      const csv = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=wastage_report.csv');
      return res.send(csv);
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch wastage report error:', err);
    res.status(500).json({ message: 'Failed to generate wastage report.' });
  }
});

// GET /api/reports/cost-variance
router.get('/cost-variance', authenticateToken, async (req, res) => {
  const { export_csv } = req.query;
  try {
    let queryText = `
      SELECT p.id, p.project_name, p.client_name, p.budget, p.status,
             COALESCE(SUM(m.ordered_qty * m.unit_cost), 0) as total_ordered_cost,
             COALESCE(SUM(m.received_qty * m.unit_cost), 0) as total_actual_cost,
             (p.budget - COALESCE(SUM(m.received_qty * m.unit_cost), 0)) as variance,
             COALESCE(inv.total_invoiced, 0) as total_invoiced_amount
      FROM projects p
      LEFT JOIN materials m ON p.id = m.project_id
      LEFT JOIN (
        SELECT project_id, SUM(amount) as total_invoiced 
        FROM invoices 
        GROUP BY project_id
      ) inv ON p.id = inv.project_id
    `;
    const params = [];
    if (req.user.role === 'site_engineer') {
      queryText += ' WHERE p.assigned_engineer_id = $1';
      params.push(req.user.id);
    }
    queryText += ` GROUP BY p.id, p.project_name, p.client_name, p.budget, p.status, inv.total_invoiced
      ORDER BY p.project_name`;

    const { rows } = await db.query(queryText, params);

    if (export_csv === 'true') {
      const csv = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cost_variance_report.csv');
      return res.send(csv);
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch cost variance error:', err);
    res.status(500).json({ message: 'Failed to generate cost variance report.' });
  }
});

// GET /api/reports/supplier-performance
router.get('/supplier-performance', authenticateToken, async (req, res) => {
  const { export_csv } = req.query;
  try {
    // Analyzes suppliers based on: number of materials provided, total supply value, and total wastage of their items
    const queryText = `
      SELECT s.id, s.supplier_name, s.contact_person, s.gst_number,
             COUNT(m.id) as materials_supplied_count,
             COALESCE(SUM(m.received_qty * m.unit_cost), 0) as total_supply_value,
             COALESCE(SUM(m.wasted_qty * m.unit_cost), 0) as total_wastage_cost,
             CASE 
               WHEN COALESCE(SUM(m.received_qty), 0) > 0 THEN 
                 ROUND((COALESCE(SUM(m.wasted_qty), 0) / COALESCE(SUM(m.received_qty), 0)) * 100, 2)
               ELSE 0.00
             END as average_material_wastage_percentage
      FROM suppliers s
      LEFT JOIN materials m ON s.id = m.supplier_id
      GROUP BY s.id, s.supplier_name, s.contact_person, s.gst_number
      ORDER BY total_supply_value DESC
    `;

    const { rows } = await db.query(queryText);

    if (export_csv === 'true') {
      const csv = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=supplier_performance_report.csv');
      return res.send(csv);
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch supplier performance error:', err);
    res.status(500).json({ message: 'Failed to generate supplier performance report.' });
  }
});

module.exports = router;
