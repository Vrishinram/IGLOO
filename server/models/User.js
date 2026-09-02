const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'RESIDENT', 'SECURITY', 'TECHNICIAN'],
    required: true,
  },
  unitNumber: {
    type: String,
    default: null,
  },
  residentType: {
    type: String,
    enum: ['OWNER', 'TENANT'],
    default: null,
  },
  phone: {
    type: String,
    required: true,
  },
  isDemoUser: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
