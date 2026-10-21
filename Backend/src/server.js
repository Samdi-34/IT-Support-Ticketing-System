

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const usersRoutes = require('./routes/users');
const ticketsRoutes = require('./routes/tickets');
const ticketUpdatesRoutes = require('./routes/ticketUpdates');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', usersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/ticket-updates', ticketUpdatesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IT Support Ticketing System API is running'
  });
});

// Database health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS database_connected');

    res.json({
      status: 'success',
      message: 'Backend and database are connected',
      database: rows[0].database_connected === 1 ? 'connected' : 'unknown'
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }
});

// Start server
const PORT = process.env.PORT || 5010;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
