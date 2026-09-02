const express = require('express');
const router = express.Router();
const { getTickets, createTicket, assignTicket, updateStatus, rateTicket, approveTicketExpense } = require('../controllers/maintenanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/tickets', verifyToken, requireRole(['ADMIN', 'RESIDENT', 'TECHNICIAN']), getTickets);
router.post('/tickets', verifyToken, requireRole(['ADMIN', 'RESIDENT']), createTicket);
router.put('/tickets/:id/assign', verifyToken, requireRole(['ADMIN']), assignTicket);
router.put('/tickets/:id/status', verifyToken, requireRole(['ADMIN', 'TECHNICIAN']), updateStatus);
router.put('/tickets/:id/rate', verifyToken, requireRole(['RESIDENT']), rateTicket);
router.post('/tickets/:id/approve-expense', verifyToken, requireRole(['ADMIN']), approveTicketExpense);
module.exports = router;
