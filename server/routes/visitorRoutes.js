const express = require('express');
const router = express.Router();
const { getPasses, createPass, verifyCode, checkIn, checkOut } = require('../controllers/visitorController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/passes', verifyToken, requireRole(['ADMIN', 'RESIDENT', 'SECURITY']), getPasses);
router.post('/create-pass', verifyToken, requireRole(['ADMIN', 'RESIDENT']), createPass);
router.post('/verify-code', verifyToken, requireRole(['SECURITY', 'ADMIN']), verifyCode);
router.post('/check-in', verifyToken, requireRole(['SECURITY', 'ADMIN']), checkIn);
router.post('/check-out', verifyToken, requireRole(['SECURITY', 'ADMIN']), checkOut);

module.exports = router;
