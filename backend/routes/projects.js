const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    let queryText = `
      SELECT p.*, u.name as engineer_name, u.email as engineer_email
      FROM projects p
      LEFT JOIN users u ON p.assigned_engineer_id = u.id
    `;
    const params = [];

    // Site engineers only see their assigned projects
    if (req.user.role === 'site_engineer') {
      queryText += ' WHERE p.assigned_engineer_id = $1';
      params.push(req.user.id);
    }

    queryText += ' ORDER BY p.created_at DESC';
    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Failed to fetch projects list.' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.name as engineer_name, u.email as engineer_email
      FROM projects p
      LEFT JOIN users u ON p.assigned_engineer_id = u.id
      WHERE p.id = $1
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch project details error:', err);
    res.status(500).json({ message: 'Failed to fetch project details.' });
  }
});

// POST /api/projects
router.post('/', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { project_name, client_name, address, budget, status, assigned_engineer_id, start_date, end_date } = req.body;

  if (!project_name || !client_name || !budget) {
    return res.status(400).json({ message: 'Project name, Client name, and Budget are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO projects (project_name, client_name, address, budget, status, assigned_engineer_id, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [project_name, client_name, address || '', budget, status || 'planning', assigned_engineer_id || null, start_date || null, end_date || null]
    );

    await db.writeAuditLog(req.user.id, 'Project Created', `Project '${project_name}' was created with budget ${budget}`);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Failed to create new project.' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  const { project_name, client_name, address, budget, status, assigned_engineer_id, start_date, end_date } = req.body;

  if (!project_name || !client_name || !budget) {
    return res.status(400).json({ message: 'Project name, Client name, and Budget are required.' });
  }

  try {
    const checkProj = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (checkProj.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const result = await db.query(
      `UPDATE projects 
       SET project_name = $1, client_name = $2, address = $3, budget = $4, status = $5, assigned_engineer_id = $6, start_date = $7, end_date = $8 
       WHERE id = $9 
       RETURNING *`,
      [project_name, client_name, address || '', budget, status, assigned_engineer_id || null, start_date || null, end_date || null, id]
    );

    await db.writeAuditLog(req.user.id, 'Project Updated', `Project ID ${id} ('${project_name}') was modified.`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const checkProj = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (checkProj.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    await db.writeAuditLog(req.user.id, 'Project Deleted', `Project ID ${id} ('${checkProj.rows[0].project_name}') was deleted.`);

    res.json({ message: `Project '${checkProj.rows[0].project_name}' has been successfully deleted.` });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Failed to delete project.' });
  }
});

module.exports = router;
