const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true,
  },
  block: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  monthlyMaintenanceFee: {
    type: Number,
    default: 3500,
  },
  currentDueStatus: {
    type: String,
    enum: ['PAID', 'PENDING', 'OVERDUE'],
    default: 'PENDING',
  },
  lastPaidDate: {
    type: Date,
  },
});

module.exports = mongoose.model('Unit', unitSchema);
