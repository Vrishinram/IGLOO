const express = require('express');
const router = express.Router();
const { login, quickDemoLogin, resetDatabase, getTechnicians } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/quick-demo-login', quickDemoLogin);
router.all('/seed', async (req, res, next) => {
  try {
    const { seedDatabase } = require('../utils/seedData');
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully with demo users, tickets, and finances.' });
  } catch (err) {
    next(err);
  }
});
router.post('/reset-database', verifyToken, requireRole(['ADMIN']), resetDatabase);
router.get('/technicians', verifyToken, requireRole(['ADMIN']), getTechnicians);

module.exports = router;
