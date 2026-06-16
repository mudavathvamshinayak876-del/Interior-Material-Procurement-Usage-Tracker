const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.writeAuditLog(user.id, 'User Login', `${user.name} logged in successfully.`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Failed to fetch users list.' });
  }
});

// POST /api/auth/users (Admin can create new users)
router.post('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );
    await db.writeAuditLog(req.user.id, 'Create User', `Created user account for ${name} (${role})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.code === '23505') {
      return res.status(400).json({ message: 'Email address is already in use.' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Failed to create user account.' });
  }
});

// GET /api/auth/logs
router.get('/logs', authenticateToken, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT al.id, al.action, al.details, al.created_at, u.name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ message: 'Failed to fetch system audit logs.' });
  }
});

// DELETE /api/auth/users/:id (Admin can remove employees)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const userId = parseInt(req.params.id);

  // Prevent admin from deleting themselves
  if (userId === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }

  try {
    // Check user exists
    const { rows: existing } = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const deletedUser = existing[0];

    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    await db.writeAuditLog(req.user.id, 'Delete User', `Removed employee ${deletedUser.name} (${deletedUser.email}, ${deletedUser.role})`);

    res.json({ message: `Employee "${deletedUser.name}" has been removed successfully.` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete employee.' });
  }
});

module.exports = router;
