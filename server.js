require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route - Friendly Welcome & Status
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Project GLUE API Server 🚀',
    team: 'AURA',
    endpoints: {
      health: '/api/health',
      data: '/api/data'
    }
  });
});

// Mount Routes
app.use('/api', require('./routes/api'));

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 GLUE Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check at http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
