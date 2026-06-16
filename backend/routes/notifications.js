const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  const { role, id: userId } = req.user;
  try {
    let queryText = '';
    const params = [];

    // Admins and PMs get all notifications, Site Engineers and Vendor Coordinators get relevant ones or all
    if (role === 'admin' || role === 'project_manager') {
      queryText = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100';
    } else {
      // Filter for notifications intended for specific users or general notification
      queryText = 'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 100';
      params.push(userId);
    }

    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const checkNotif = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (checkNotif.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const result = await db.query(
      'UPDATE notifications SET status = \'read\' WHERE id = $1 RETURNING *',
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update notification status error:', err);
    res.status(500).json({ message: 'Failed to update notification status.' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, async (req, res) => {
  const { role, id: userId } = req.user;
  try {
    let queryText = '';
    const params = [];

    if (role === 'admin' || role === 'project_manager') {
      queryText = 'UPDATE notifications SET status = \'read\' WHERE status = \'unread\' RETURNING *';
    } else {
      queryText = 'UPDATE notifications SET status = \'read\' WHERE (user_id = $1 OR user_id IS NULL) AND status = \'unread\' RETURNING *';
      params.push(userId);
    }

    const result = await db.query(queryText, params);
    res.json({ message: `Successfully marked ${result.rows.length} notifications as read.` });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
});

module.exports = router;
