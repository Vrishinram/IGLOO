require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const treasuryRoutes = require('./routes/treasuryRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Ensure MongoDB is connected before handling any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    res.status(500).json({ success: false, message: 'Database connection error: ' + err.message });
  }
});

// Mount routers
const mountRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/maintenance`, maintenanceRoutes);
  app.use(`${prefix}/treasury`, treasuryRoutes);
  app.use(`${prefix}/visitors`, visitorRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/notices`, noticeRoutes);
  app.use(`${prefix}/emergency`, emergencyRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/admin`, authRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Serve client static build in production (for Render / Docker / local standalone)
const path = require('path');
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/maintenance')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Error handler
app.use(errorHandler);

// Only listen when executed directly (local development or standalone node server)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

// Export express app for Vercel serverless functions
module.exports = app;
