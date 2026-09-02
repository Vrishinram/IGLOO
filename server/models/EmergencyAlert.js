const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  }
});

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
