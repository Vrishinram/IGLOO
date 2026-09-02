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

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', authRoutes); // reset-database is inside authRoutes

// Error handler
app.use(errorHandler);

// Serve client static build in production
const path = require('path');
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

// Export the express app for Vercel serverless functions
module.exports = app;
// Only listen when executed directly (local development)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}
