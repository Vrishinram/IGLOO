const express = require('express');
const router = express.Router();
const { getSummary, getTransactions, createTransaction, payDues, getUnitStatus, raiseFund, getUnitLedger } = require('../controllers/treasuryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/summary', verifyToken, requireRole(['ADMIN', 'RESIDENT']), getSummary);
router.get('/transactions', verifyToken, requireRole(['ADMIN', 'RESIDENT']), getTransactions);
router.post('/transactions', verifyToken, requireRole(['ADMIN']), createTransaction);
router.post('/pay-dues', verifyToken, requireRole(['RESIDENT']), payDues);
router.get('/unit-status', verifyToken, requireRole(['ADMIN', 'RESIDENT', 'SECURITY']), getUnitStatus);

router.post('/raise-fund', verifyToken, requireRole(['ADMIN']), raiseFund);
router.get('/unit-ledger/:unitNumber', verifyToken, requireRole(['ADMIN', 'RESIDENT']), getUnitLedger);

module.exports = router;
