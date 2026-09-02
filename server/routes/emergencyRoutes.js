const express = require('express');
const router = express.Router();
const EmergencyAlert = require('../models/EmergencyAlert');
const { verifyToken, requireRole } = require('../middleware/auth');

// Trigger SOS
router.post('/sos', verifyToken, requireRole(['RESIDENT']), async (req, res, next) => {
  try {
    const alert = new EmergencyAlert({
      unitNumber: req.user.unitNumber,
      reportedBy: req.user.userId
    });
    await alert.save();
    res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
});

// Get active SOS alerts (for Security)
router.get('/sos/active', verifyToken, requireRole(['SECURITY', 'ADMIN']), async (req, res, next) => {
  try {
    const alerts = await EmergencyAlert.find({ status: 'ACTIVE' }).populate('reportedBy', 'name phone').sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
});

// Resolve SOS
router.put('/sos/:id/resolve', verifyToken, requireRole(['SECURITY', 'ADMIN']), async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', resolvedAt: Date.now() },
      { new: true }
    );
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
