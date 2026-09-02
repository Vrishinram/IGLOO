const express = require('express');
const router = express.Router();
const { triageIssue, auditFinances, generateNotice } = require('../controllers/aiController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/triage-issue', verifyToken, triageIssue);
router.post('/audit-finances', verifyToken, requireRole(['ADMIN']), auditFinances);
router.post('/generate-notice', verifyToken, requireRole(['ADMIN']), generateNotice);

module.exports = router;
