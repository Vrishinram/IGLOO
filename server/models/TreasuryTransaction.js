const mongoose = require('mongoose');

const treasuryTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['INFLOW', 'OUTFLOW'],
    required: true,
  },
  category: {
    type: String,
    enum: [
      'MAINTENANCE_DUE',
      'CORPUS_FUND',
      'SINKING_FUND',
      'FACILITY_BOOKING',
      'SECURITY',
      'WATER',
      'ELECTRICITY',
      'REPAIRS',
      'EVENTS',
      'GARDENING',
      'HOUSEKEEPING',
      'MISC',
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  unitNumber: {
    type: String,
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendorName: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  receiptUrl: {
    type: String,
  },
});

module.exports = mongoose.model('TreasuryTransaction', treasuryTransactionSchema);
