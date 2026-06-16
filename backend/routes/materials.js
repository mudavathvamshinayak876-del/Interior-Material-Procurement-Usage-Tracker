const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Helper function to create notification and broadcast it
async function checkAlertsAndNotify(req, material, project_name) {
  const received = parseFloat(material.received_qty) || 0;
  const used = parseFloat(material.used_qty) || 0;
  const wasted = parseFloat(material.wasted_qty) || 0;
  const remaining = parseFloat(material.remaining_qty) || 0;
  const name = material.material_name;
  const projectId = material.project_id;

  const broadcast = req.app.get('broadcast');

  // 1. Check for Excess Wastage (> 10% of received quantity)
  if (received > 0 && (wasted / received) > 0.10) {
    const wastagePercentage = ((wasted / received) * 100).toFixed(1);
    const msg = `${project_name}: Material '${name}' has wastage of ${wasted} units (${wastagePercentage}%), exceeding the 10% threshold.`;
    
    // Check if notification already exists to avoid duplication
    const duplicate = await db.query(
      'SELECT id FROM notifications WHERE message = $1 AND status = \'unread\'',
      [msg]
    );

    if (duplicate.rows.length === 0) {
      // Get admins and PMs to notify
      const users = await db.query('SELECT id FROM users WHERE role IN (\'admin\', \'project_manager\')');
      for (const u of users.rows) {
        const notifResult = await db.query(
          'INSERT INTO notifications (user_id, message, type, status) VALUES ($1, $2, $3, $4) RETURNING *',
          [u.id, msg, 'excess_wastage', 'unread']
        );
        if (broadcast) {
          broadcast({ type: 'NEW_NOTIFICATION', notification: notifResult.rows[0] });
        }
      }
    }
  }

  // 2. Check for Low Inventory (remaining <= 5 units, and it's already received/used)
  if (received > 0 && remaining <= 5) {
    const msg = `Low Inventory Alert in ${project_name}: Remaining '${name}' is only ${remaining} units.`;
    
    const duplicate = await db.query(
      'SELECT id FROM notifications WHERE message = $1 AND status = \'unread\'',
      [msg]
    );

    if (duplicate.rows.length === 0) {
      const users = await db.query('SELECT id FROM users WHERE role IN (\'admin\', \'project_manager\', \'site_engineer\')');
      for (const u of users.rows) {
        const notifResult = await db.query(
          'INSERT INTO notifications (user_id, message, type, status) VALUES ($1, $2, $3, $4) RETURNING *',
          [u.id, msg, 'low_inventory', 'unread']
        );
        if (broadcast) {
          broadcast({ type: 'NEW_NOTIFICATION', notification: notifResult.rows[0] });
        }
      }
    }
  }
}

// GET /api/materials
// Can filter by project_id
router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    let queryText = `
      SELECT m.*, p.project_name, s.supplier_name 
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

    // Site engineers only see materials from their assigned projects
    if (req.user.role === 'site_engineer') {
      params.push(req.user.id);
      conditions.push(`p.assigned_engineer_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += ' ORDER BY m.created_at DESC';
    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch materials error:', err);
    res.status(500).json({ message: 'Failed to fetch materials.' });
  }
});

// GET /api/materials/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT m.*, p.project_name, s.supplier_name 
      FROM materials m
      JOIN projects p ON m.project_id = p.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.id = $1
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Material not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch material error:', err);
    res.status(500).json({ message: 'Failed to fetch material details.' });
  }
});

// POST /api/materials (Add/Order new material)
// Roles allowed: admin, project_manager, vendor_coordinator
router.post('/', authenticateToken, authorizeRoles('admin', 'project_manager', 'vendor_coordinator'), async (req, res) => {
  const { project_id, material_name, category, ordered_qty, unit_cost, supplier_id, order_date } = req.body;

  if (!project_id || !material_name || !category || !ordered_qty || !unit_cost) {
    return res.status(400).json({ message: 'Project ID, Material Name, Category, Ordered Quantity, and Unit Cost are required.' });
  }

  try {
    // Check if project exists
    const projCheck = await db.query('SELECT project_name FROM projects WHERE id = $1', [project_id]);
    if (projCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    const projectName = projCheck.rows[0].project_name;

    // Remaining, Received, Used, Wasted defaults to 0.00 on creation
    const result = await db.query(
      `INSERT INTO materials (project_id, material_name, category, ordered_qty, received_qty, used_qty, wasted_qty, remaining_qty, unit_cost, supplier_id, order_date, status) 
       VALUES ($1, $2, $3, $4, 0.0, 0.0, 0.0, 0.0, $5, $6, $7, 'ordered') 
       RETURNING *`,
      [project_id, material_name, category, ordered_qty, unit_cost, supplier_id || null, order_date || null]
    );

    const newMaterial = result.rows[0];

    await db.writeAuditLog(
      req.user.id, 
      'Material Ordered', 
      `Ordered ${ordered_qty} units of '${material_name}' for Project '${projectName}' at unit cost of ${unit_cost}`
    );

    res.status(201).json(newMaterial);
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ message: 'Failed to record material order.' });
  }
});

// PUT /api/materials/:id (Update Material details or log Usage/Received)
// Site Engineer can only edit received_qty, used_qty, wasted_qty
// Admin/PM/Vendor can edit everything
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;

  try {
    // Fetch original material details
    const matQuery = await db.query(`
      SELECT m.*, p.project_name 
      FROM materials m 
      JOIN projects p ON m.project_id = p.id 
      WHERE m.id = $1
    `, [id]);

    if (matQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    const original = matQuery.rows[0];
    const projectName = original.project_name;

    let updated = {};

    if (role === 'site_engineer') {
      // Site Engineer restricted updates
      const received_qty = req.body.received_qty !== undefined ? parseFloat(req.body.received_qty) : parseFloat(original.received_qty);
      const used_qty = req.body.used_qty !== undefined ? parseFloat(req.body.used_qty) : parseFloat(original.used_qty);
      const wasted_qty = req.body.wasted_qty !== undefined ? parseFloat(req.body.wasted_qty) : parseFloat(original.wasted_qty);
      
      // Auto Calculation: remaining = received - used - wasted
      const remaining_qty = received_qty - used_qty - wasted_qty;
      const status = received_qty >= original.ordered_qty ? 'received' : 'partially_received';

      const updateResult = await db.query(
        `UPDATE materials 
         SET received_qty = $1, used_qty = $2, wasted_qty = $3, remaining_qty = $4, status = $5 
         WHERE id = $6 
         RETURNING *`,
        [received_qty, used_qty, wasted_qty, remaining_qty, status, id]
      );
      
      updated = updateResult.rows[0];

      await db.writeAuditLog(
        userId, 
        'Material Usage Updated', 
        `Site Engineer updated usage for '${original.material_name}' in '${projectName}'. Received: ${received_qty}, Used: ${used_qty}, Wasted: ${wasted_qty}, Remaining: ${remaining_qty}`
      );
    } else {
      // Admin, PM, Vendor Coordinator can update all fields
      const material_name = req.body.material_name || original.material_name;
      const category = req.body.category || original.category;
      const ordered_qty = req.body.ordered_qty !== undefined ? parseFloat(req.body.ordered_qty) : parseFloat(original.ordered_qty);
      const received_qty = req.body.received_qty !== undefined ? parseFloat(req.body.received_qty) : parseFloat(original.received_qty);
      const used_qty = req.body.used_qty !== undefined ? parseFloat(req.body.used_qty) : parseFloat(original.used_qty);
      const wasted_qty = req.body.wasted_qty !== undefined ? parseFloat(req.body.wasted_qty) : parseFloat(original.wasted_qty);
      const unit_cost = req.body.unit_cost !== undefined ? parseFloat(req.body.unit_cost) : parseFloat(original.unit_cost);
      const supplier_id = req.body.supplier_id !== undefined ? req.body.supplier_id : original.supplier_id;
      const order_date = req.body.order_date !== undefined ? req.body.order_date : original.order_date;
      
      // Auto Calculation
      const remaining_qty = received_qty - used_qty - wasted_qty;
      let status = req.body.status || original.status;
      if (!req.body.status && received_qty > 0) {
        status = received_qty >= ordered_qty ? 'received' : 'partially_received';
      }

      const updateResult = await db.query(
        `UPDATE materials 
         SET material_name = $1, category = $2, ordered_qty = $3, received_qty = $4, used_qty = $5, wasted_qty = $6, remaining_qty = $7, unit_cost = $8, supplier_id = $9, order_date = $10, status = $11 
         WHERE id = $12 
         RETURNING *`,
        [material_name, category, ordered_qty, received_qty, used_qty, wasted_qty, remaining_qty, unit_cost, supplier_id, order_date, status, id]
      );
      
      updated = updateResult.rows[0];

      await db.writeAuditLog(
        userId, 
        'Material Updated', 
        `Updated material '${material_name}' specifications for Project '${projectName}'`
      );
    }

    // Check inventory thresholds and log alerts/notifications
    await checkAlertsAndNotify(req, updated, projectName);

    res.json(updated);
  } catch (err) {
    console.error('Update material error:', err);
    res.status(500).json({ message: 'Failed to update material record.' });
  }
});

// DELETE /api/materials/:id
// Roles allowed: admin, project_manager
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const matQuery = await db.query('SELECT material_name, project_id FROM materials WHERE id = $1', [id]);
    if (matQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    const { material_name, project_id } = matQuery.rows[0];
    const projQuery = await db.query('SELECT project_name FROM projects WHERE id = $1', [project_id]);
    const projectName = projQuery.rows.length > 0 ? projQuery.rows[0].project_name : 'Unknown';

    await db.query('DELETE FROM materials WHERE id = $1', [id]);
    await db.writeAuditLog(req.user.id, 'Material Deleted', `Deleted material '${material_name}' from Project '${projectName}'`);

    res.json({ message: `Material '${material_name}' has been successfully deleted.` });
  } catch (err) {
    console.error('Delete material error:', err);
    res.status(500).json({ message: 'Failed to delete material.' });
  }
});

module.exports = router;
