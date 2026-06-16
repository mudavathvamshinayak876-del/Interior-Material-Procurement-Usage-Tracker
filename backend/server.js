// Glory Simon Interiors Material Tracker - Backend Server
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const materialRoutes = require('./routes/materials');
const supplierRoutes = require('./routes/suppliers');
const invoiceRoutes = require('./routes/invoices');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/tasks');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS setup
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local invoice uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WebSocket setup
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket server');
  
  ws.send(JSON.stringify({ 
    type: 'CONNECTION_ACK', 
    message: 'Successfully connected to Glory Simon Interiors Real-time alerts.' 
  }));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket server');
  });
});

// Broadcast helper function attached to Express app
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};
app.set('broadcast', broadcast);

// Mount API Routes
const db = require('./db');
app.get('/db-test', async (req, res) => {
  try {
    // Run update query to fix seeds
    await db.query("UPDATE users SET password_hash = '$2a$10$Z4b8c14hSOdAxqc76IxSEOQAO4Im9uEzeA4iXonawMurdjGN/sRe2'");
    const result = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'connected', result: result.rows, isPostgres: db.isPostgres, message: 'Password hashes updated successfully.' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message, stack: err.stack });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', taskRoutes); // Mounts /api/tasks and /api/workers

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend static assets in production if needed
// (For this setup, we run frontend and backend as separate local processes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'An unexpected server error occurred.' 
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Glory Simon Material Tracker Server running on port ${PORT}`);
  console.log(`WebSocket server initialized on same port.`);
  console.log(`=======================================================`);
});

module.exports = app;

