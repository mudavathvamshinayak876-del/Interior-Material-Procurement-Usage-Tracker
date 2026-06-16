const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ==========================================
// WORKERS ROUTING
// ==========================================

// GET /api/workers - Fetch all workers
router.get('/workers', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM workers ORDER BY trade, name');
    res.json(rows);
  } catch (err) {
    console.error('Fetch workers error:', err);
    res.status(500).json({ message: 'Failed to fetch workers list.' });
  }
});

// POST /api/workers - Add a new worker
// Allowed roles: admin, project_manager, site_engineer
router.post('/workers', authenticateToken, authorizeRoles('admin', 'project_manager', 'site_engineer'), async (req, res) => {
  const { name, trade, phone, status } = req.body;

  if (!name || !trade) {
    return res.status(400).json({ message: 'Name and trade fields are required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO workers (name, trade, phone, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, trade, phone || null, status || 'available']
    );

    await db.writeAuditLog(req.user.id, 'Worker Registered', `Registered worker '${name}' under trade '${trade}'`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create worker error:', err);
    res.status(500).json({ message: 'Failed to register new worker.' });
  }
});

// PUT /api/workers/:id - Update worker details
router.put('/workers/:id', authenticateToken, authorizeRoles('admin', 'project_manager', 'site_engineer'), async (req, res) => {
  const { id } = req.params;
  const { name, trade, phone, status } = req.body;

  try {
    const check = await db.query('SELECT * FROM workers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const original = check.rows[0];
    const newName = name || original.name;
    const newTrade = trade || original.trade;
    const newPhone = phone !== undefined ? phone : original.phone;
    const newStatus = status || original.status;

    const { rows } = await db.query(
      `UPDATE workers 
       SET name = $1, trade = $2, phone = $3, status = $4 
       WHERE id = $5 
       RETURNING *`,
      [newName, newTrade, newPhone, newStatus, id]
    );

    await db.writeAuditLog(req.user.id, 'Worker Updated', `Updated worker '${newName}' profile.`);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update worker error:', err);
    res.status(500).json({ message: 'Failed to update worker profile.' });
  }
});

// DELETE /api/workers/:id - Remove worker
router.delete('/workers/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT name FROM workers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    await db.query('DELETE FROM workers WHERE id = $1', [id]);
    await db.writeAuditLog(req.user.id, 'Worker Removed', `Deleted worker '${check.rows[0].name}' from records.`);
    res.json({ message: 'Worker profile deleted successfully.' });
  } catch (err) {
    console.error('Delete worker error:', err);
    res.status(500).json({ message: 'Failed to delete worker.' });
  }
});


// ==========================================
// TASK ASSIGNMENTS ROUTING
// ==========================================

// GET /api/tasks - Fetch all work assignments (scoped for site engineers)
router.get('/tasks', authenticateToken, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    let queryText = `
      SELECT t.*, p.project_name, w.name as worker_name, w.trade as worker_trade
      FROM work_assignments t
      JOIN projects p ON t.project_id = p.id
      JOIN workers w ON t.worker_id = w.id
    `;
    const params = [];

    // Site Engineers only see tasks assigned to their projects
    if (role === 'site_engineer') {
      queryText += ' WHERE p.assigned_engineer_id = $1';
      params.push(userId);
    }

    queryText += ' ORDER BY t.created_at DESC';
    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch task list.' });
  }
});

// POST /api/tasks - Assign a task
router.post('/tasks', authenticateToken, authorizeRoles('admin', 'project_manager', 'site_engineer'), async (req, res) => {
  const { project_id, worker_id, task_description, start_date, end_date, status } = req.body;
  const { id: userId, role } = req.user;

  if (!project_id || !worker_id || !task_description) {
    return res.status(400).json({ message: 'Project ID, Worker ID, and task description are required.' });
  }

  try {
    // 1. Verify project exists
    const projQuery = await db.query('SELECT * FROM projects WHERE id = $1', [project_id]);
    if (projQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    const project = projQuery.rows[0];

    // 2. Security Check: Site engineer can only assign tasks to their own projects
    if (role === 'site_engineer' && project.assigned_engineer_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You can only assign work to your own project sites.' });
    }

    // 3. Verify worker exists
    const workerQuery = await db.query('SELECT name FROM workers WHERE id = $1', [worker_id]);
    if (workerQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // 4. Create task assignment
    const { rows } = await db.query(
      `INSERT INTO work_assignments (project_id, worker_id, task_description, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project_id, worker_id, task_description, start_date || null, end_date || null, status || 'assigned']
    );

    // 5. Update worker status to 'busy' if task is assigned and in progress
    if (status === 'in_progress') {
      await db.query("UPDATE workers SET status = 'busy' WHERE id = $1", [worker_id]);
    }

    await db.writeAuditLog(
      userId, 
      'Task Assigned', 
      `Assigned worker '${workerQuery.rows[0].name}' to project '${project.project_name}': ${task_description}`
    );

    // Return full details including joins
    const fullTask = await db.query(
      `SELECT t.*, p.project_name, w.name as worker_name, w.trade as worker_trade
       FROM work_assignments t
       JOIN projects p ON t.project_id = p.id
       JOIN workers w ON t.worker_id = w.id
       WHERE t.id = $1`,
      [rows[0].id]
    );

    res.status(201).json(fullTask.rows[0]);
  } catch (err) {
    console.error('Assign task error:', err);
    res.status(500).json({ message: 'Failed to create task assignment.' });
  }
});

// PUT /api/tasks/:id - Update task assignment details/status
router.put('/tasks/:id', authenticateToken, authorizeRoles('admin', 'project_manager', 'site_engineer'), async (req, res) => {
  const { id } = req.params;
  const { task_description, start_date, end_date, status, worker_id } = req.body;
  const { id: userId, role } = req.user;

  try {
    // 1. Fetch current task details
    const taskQuery = await db.query(
      `SELECT t.*, p.assigned_engineer_id, p.project_name 
       FROM work_assignments t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1`, 
      [id]
    );

    if (taskQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Task assignment not found.' });
    }

    const original = taskQuery.rows[0];

    // 2. Security Check: Site engineer can only update tasks on their own projects
    if (role === 'site_engineer' && original.assigned_engineer_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You cannot modify task assignments for other sites.' });
    }

    const newDesc = task_description || original.task_description;
    const newStart = start_date !== undefined ? start_date : original.start_date;
    const newEnd = end_date !== undefined ? end_date : original.end_date;
    const newStatus = status || original.status;
    const newWorkerId = worker_id || original.worker_id;

    // 3. Perform update
    const { rows } = await db.query(
      `UPDATE work_assignments 
       SET task_description = $1, start_date = $2, end_date = $3, status = $4, worker_id = $5 
       WHERE id = $6 
       RETURNING *`,
      [newDesc, newStart, newEnd, newStatus, newWorkerId, id]
    );

    // 4. Manage worker status based on task state
    if (newStatus === 'completed') {
      // Free worker if they have no other active tasks
      const activeTasks = await db.query(
        "SELECT id FROM work_assignments WHERE worker_id = $1 AND status IN ('assigned', 'in_progress') AND id != $2",
        [newWorkerId, id]
      );
      if (activeTasks.rows.length === 0) {
        await db.query("UPDATE workers SET status = 'available' WHERE id = $1", [newWorkerId]);
      }
    } else if (newStatus === 'in_progress') {
      await db.query("UPDATE workers SET status = 'busy' WHERE id = $1", [newWorkerId]);
    }

    await db.writeAuditLog(
      userId, 
      'Task Updated', 
      `Updated task assignment status to '${newStatus}' for project '${original.project_name}'`
    );

    // Fetch full returned details
    const fullTask = await db.query(
      `SELECT t.*, p.project_name, w.name as worker_name, w.trade as worker_trade
       FROM work_assignments t
       JOIN projects p ON t.project_id = p.id
       JOIN workers w ON t.worker_id = w.id
       WHERE t.id = $1`,
      [rows[0].id]
    );

    res.json(fullTask.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Failed to update task assignment.' });
  }
});

// DELETE /api/tasks/:id - Delete a task assignment
router.delete('/tasks/:id', authenticateToken, authorizeRoles('admin', 'project_manager', 'site_engineer'), async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  try {
    const taskQuery = await db.query(
      `SELECT t.*, p.assigned_engineer_id, p.project_name 
       FROM work_assignments t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1`, 
      [id]
    );

    if (taskQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Task assignment not found.' });
    }

    const original = taskQuery.rows[0];

    // Security Check
    if (role === 'site_engineer' && original.assigned_engineer_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You cannot delete task assignments for other sites.' });
    }

    await db.query('DELETE FROM work_assignments WHERE id = $1', [id]);

    // Free the worker check
    const activeTasks = await db.query(
      "SELECT id FROM work_assignments WHERE worker_id = $1 AND status IN ('assigned', 'in_progress')",
      [original.worker_id]
    );
    if (activeTasks.rows.length === 0) {
      await db.query("UPDATE workers SET status = 'available' WHERE id = $1", [original.worker_id]);
    }

    await db.writeAuditLog(
      userId, 
      'Task Deleted', 
      `Deleted task assignment on project '${original.project_name}': ${original.task_description}`
    );

    res.json({ message: 'Task assignment deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task assignment.' });
  }
});

module.exports = router;
