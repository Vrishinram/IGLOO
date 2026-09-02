const MaintenanceTicket = require('../models/MaintenanceTicket');

const getTickets = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'RESIDENT') {
      query.reportedBy = req.user.userId;
    } else if (req.user.role === 'TECHNICIAN') {
      query.assignedTo = req.user.userId;
    }
    // ADMIN sees all

    const tickets = await MaintenanceTicket.find(query).sort({ createdAt: -1 }).populate('reportedBy', 'name').populate('assignedTo', 'name');
    res.json({ success: true, tickets });
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { unitNumber, title, description, category, priority, issueScope, aiEstimatedCost, aiEstimatedTime, aiTriageAnalysis, photoUrl } = req.body;
    
    // Resolve target unit: if COMMON, use COMMON, otherwise fallback to resident's unitNumber
    const targetUnit = issueScope === 'COMMON' ? 'COMMON' : (unitNumber || req.user.unitNumber || 'A-102');
    
    // Generate unique human-readable ticket ID (TKT-XXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-${randomNum}`;

    // Normalize and validate category enum
    let safeCategory = (category || 'OTHER').toUpperCase();
    const validCategories = ['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'CIVIL', 'APPLIANCE', 'COMMON_AREA', 'OTHER'];
    if (!validCategories.includes(safeCategory)) {
      safeCategory = 'OTHER';
    }

    const ticket = new MaintenanceTicket({
      ticketId,
      unitNumber: targetUnit,
      reportedBy: req.user.userId,
      title,
      description,
      category: safeCategory,
      priority: priority || 'MEDIUM',
      issueScope: issueScope || 'PRIVATE',
      aiEstimatedCost,
      aiEstimatedTime,
      aiTriageAnalysis,
      photoUrl
    });

    await ticket.save();
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const { assignedTo, technicianId } = req.body;
    const assigneeId = assignedTo || technicianId;
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assigneeId, status: 'ASSIGNED' },
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes, partsCost, laborCost, expenseNotes } = req.body;
    const updateData = { status };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = Date.now();
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      if (partsCost !== undefined) updateData.partsCost = partsCost;
      if (laborCost !== undefined) updateData.laborCost = laborCost;
      if (expenseNotes !== undefined) updateData.expenseNotes = expenseNotes;
    }
    
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const rateTicket = async (req, res, next) => {
  try {
    const { residentRating, rating } = req.body;
    const finalRating = residentRating || rating;
    const ticket = await MaintenanceTicket.findOneAndUpdate(
      { _id: req.params.id, reportedBy: req.user.userId },
      { residentRating: finalRating, status: 'CLOSED' },
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found or unauthorized' });
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const TreasuryTransaction = require('../models/TreasuryTransaction'); // Will add this require at the top
const Unit = require('../models/Unit'); // Will add this require at the top

const approveTicketExpense = async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Ticket must be resolved to approve expenses' });
    }
    
    if (ticket.paymentStatus !== 'UNBILLED') {
      return res.status(400).json({ success: false, message: 'Expense already processed' });
    }
    
    const totalCost = ticket.partsCost + ticket.laborCost;
    if (totalCost <= 0) {
      ticket.paymentStatus = 'PAID_BY_TREASURY'; // No cost, just mark done
      await ticket.save();
      return res.json({ success: true, ticket });
    }

    if (ticket.issueScope === 'COMMON') {
      // Deduct from Treasury
      const transaction = new TreasuryTransaction({
        transactionType: 'OUTFLOW',
        category: 'Maintenance & Repairs',
        amount: totalCost,
        description: `Common Area Repair - ${ticket.ticketId}: ${ticket.title}`,
        loggedBy: req.user.userId,
      });
      await transaction.save();
      ticket.paymentStatus = 'PAID_BY_TREASURY';
    } else {
      // Bill to Resident's Unit
      const unit = await Unit.findOne({ unitNumber: ticket.unitNumber });
      if (unit) {
        // Here we could have an 'invoices' array, but for now we'll just add to their next bill or mark OVERDUE
        // Or realistically create an INFLOW pending transaction... wait, Treasury is cash-basis usually.
        // Let's just update the unit's status to reflect a pending charge.
        unit.currentDueStatus = 'PENDING';
        unit.monthlyMaintenanceFee += totalCost; // Add to their outstanding fee
        await unit.save();
      }
      ticket.paymentStatus = 'BILLED_TO_RESIDENT';
    }

    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTickets, createTicket, assignTicket, updateStatus, rateTicket, approveTicketExpense };
