const express = require('express');
const router = express.Router();
const { login, quickDemoLogin, resetDatabase, getTechnicians } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/quick-demo-login', quickDemoLogin);
router.post('/reset-database', verifyToken, requireRole(['ADMIN']), resetDatabase);
router.get('/technicians', verifyToken, requireRole(['ADMIN']), getTechnicians);

module.exports = router;
