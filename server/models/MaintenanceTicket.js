const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
  },
  unitNumber: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'CIVIL', 'APPLIANCE', 'COMMON_AREA', 'OTHER'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'MEDIUM',
  },
  aiEstimatedCost: {
    type: String,
  },
  aiEstimatedTime: {
    type: String,
  },
  aiTriageAnalysis: {
    type: String,
  },
  status: {
    type: String,
    enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resolutionNotes: {
    type: String,
  },
  residentRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  photoUrl: {
    type: String,
  },
  issueScope: {
    type: String,
    enum: ['PRIVATE', 'COMMON'],
    default: 'PRIVATE',
  },
  partsCost: {
    type: Number,
    default: 0,
  },
  laborCost: {
    type: Number,
    default: 0,
  },
  expenseNotes: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['UNBILLED', 'BILLED_TO_RESIDENT', 'PAID_BY_TREASURY'],
    default: 'UNBILLED',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

// Auto-generate ticketId
maintenanceTicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastTicket = await this.constructor.findOne({}, 'ticketId', { sort: { ticketId: -1 } });
      if (lastTicket && lastTicket.ticketId) {
        const lastIdMatch = lastTicket.ticketId.match(/^TKT-(\d+)$/);
        if (lastIdMatch) {
          const nextId = parseInt(lastIdMatch[1], 10) + 1;
          this.ticketId = `TKT-${nextId}`;
        } else {
          this.ticketId = 'TKT-1001';
        }
      } else {
        this.ticketId = 'TKT-1001';
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
