const mongoose = require('mongoose');

const visitorPassSchema = new mongoose.Schema({
  passCode: {
    type: String,
    required: true,
    unique: true,
  },
  unitNumber: {
    type: String,
    required: true,
  },
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  visitorName: {
    type: String,
    required: true,
  },
  visitorPhone: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['GUEST', 'DELIVERY', 'CAB', 'SERVICE', 'OTHER'],
    default: 'GUEST',
  },
  vehicleNumber: {
    type: String,
  },
  expectedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['PRE_APPROVED', 'INSIDE', 'COMPLETED', 'REJECTED'],
    default: 'PRE_APPROVED',
  },
  checkInTime: {
    type: Date,
  },
  checkOutTime: {
    type: Date,
  },
  verifiedByGuard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VisitorPass', visitorPassSchema);
