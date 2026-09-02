const mongoose = require('mongoose');

const unitChargeSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING',
  },
  targetResidentType: {
    type: String,
    enum: ['OWNER', 'TENANT', 'ALL'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('UnitCharge', unitChargeSchema);
