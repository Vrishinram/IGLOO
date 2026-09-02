const TreasuryTransaction = require('../models/TreasuryTransaction');
const Unit = require('../models/Unit');
const User = require('../models/User');
const UnitCharge = require('../models/UnitCharge');
const SocietyNotice = require('../models/SocietyNotice');

const getSummary = async (req, res, next) => {
  try {
    const transactions = await TreasuryTransaction.find();
    
    let totalBalance = 0;
    let currentMonthInflow = 0;
    let currentMonthOutflow = 0;
    const categoryBreakdown = {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    transactions.forEach(t => {
      if (t.transactionType === 'INFLOW') {
        totalBalance += t.amount;
        if (new Date(t.date) >= startOfMonth) {
          currentMonthInflow += t.amount;
        }
      } else if (t.transactionType === 'OUTFLOW') {
        totalBalance -= t.amount;
        if (new Date(t.date) >= startOfMonth) {
          currentMonthOutflow += t.amount;
        }
      }

      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = 0;
      }
      categoryBreakdown[t.category] += (t.transactionType === 'INFLOW' ? t.amount : -t.amount);
    });

    res.json({
      success: true,
      totalBalance,
      currentMonthInflow,
      currentMonthOutflow,
      categoryBreakdown
    });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await TreasuryTransaction.find()
      .sort({ date: -1 })
      .populate('loggedBy', 'name');
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { transactionType, category, amount, description, vendorName } = req.body;
    
    const transaction = new TreasuryTransaction({
      transactionType,
      category,
      amount,
      description,
      vendorName,
      loggedBy: req.user.userId
    });

    await transaction.save();
    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

const payDues = async (req, res, next) => {
  try {
    const { unitNumber, amount, chargeId, description } = req.body;
    const targetUnit = unitNumber || req.user.unitNumber;
    if (!targetUnit) return res.status(400).json({ success: false, message: 'Unit number is required' });

    const unit = await Unit.findOne({ unitNumber: targetUnit });
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });

    // Case 1: Paying a specific raised fund charge
    if (chargeId) {
      const charge = await UnitCharge.findById(chargeId);
      if (!charge) return res.status(404).json({ success: false, message: 'Charge bill not found' });

      charge.status = 'PAID';
      await charge.save();

      const payAmount = charge.amount;
      const tx = new TreasuryTransaction({
        transactionType: 'INFLOW',
        category: 'MAINTENANCE_DUE',
        amount: payAmount,
        description: `Special Fund: ${charge.description} - Flat ${unit.unitNumber}`,
        unitNumber: unit.unitNumber,
        loggedBy: req.user.userId
      });
      await tx.save();

      // Check if any other charges or maintenance are still pending
      const remainingCharges = await UnitCharge.countDocuments({ unitNumber: targetUnit, status: 'PENDING' });
      if (remainingCharges === 0 && unit.currentDueStatus === 'PAID') {
        unit.lastPaidDate = new Date();
        await unit.save();
      }

      return res.json({ 
        success: true, 
        message: `Payment of ₹${payAmount.toLocaleString()} for "${charge.description}" recorded successfully!`, 
        transaction: tx, 
        unit 
      });
    }

    // Case 2: Paying monthly maintenance or full outstanding dues
    const pendingCharges = await UnitCharge.find({ unitNumber: targetUnit, status: 'PENDING' });
    const chargesTotal = pendingCharges.reduce((acc, c) => acc + c.amount, 0);
    const maintenanceDue = unit.currentDueStatus !== 'PAID' ? (unit.monthlyMaintenanceFee || 3500) : 0;
    
    const payAmount = amount || (maintenanceDue + chargesTotal) || (unit.monthlyMaintenanceFee || 3500);

    const txDesc = description || (
      chargesTotal > 0 && maintenanceDue > 0
        ? `Maintenance & Special Fund dues for Flat ${unit.unitNumber}`
        : chargesTotal > 0
        ? `Special Fund dues for Flat ${unit.unitNumber}`
        : `Monthly Maintenance fee for Flat ${unit.unitNumber}`
    );

    const tx = new TreasuryTransaction({
      transactionType: 'INFLOW',
      category: 'MAINTENANCE_DUE',
      amount: payAmount,
      description: txDesc,
      unitNumber: unit.unitNumber,
      loggedBy: req.user.userId
    });
    await tx.save();

    // Mark all pending UnitCharge items for this flat as PAID
    if (pendingCharges.length > 0) {
      await UnitCharge.updateMany(
        { unitNumber: targetUnit, status: 'PENDING' },
        { $set: { status: 'PAID' } }
      );
    }

    unit.currentDueStatus = 'PAID';
    unit.lastPaidDate = new Date();
    await unit.save();

    res.json({ 
      success: true, 
      message: `Dues for Flat ${unit.unitNumber} (₹${payAmount.toLocaleString()}) marked as paid successfully!`, 
      transaction: tx, 
      unit 
    });
  } catch (err) {
    next(err);
  }
};

const getUnitStatus = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'RESIDENT') {
      query.unitNumber = req.user.unitNumber;
    }
    const units = await Unit.find(query).sort({ unitNumber: 1 }).lean();

    // Calculate pending charges per unit
    const pendingCharges = await UnitCharge.find({ status: 'PENDING' });
    const chargesByUnit = {};
    for (const c of pendingCharges) {
      chargesByUnit[c.unitNumber] = (chargesByUnit[c.unitNumber] || 0) + c.amount;
    }

    const enrichedUnits = units.map(u => {
      const chargeDue = chargesByUnit[u.unitNumber] || 0;
      const maintenanceDue = u.currentDueStatus !== 'PAID' ? (u.monthlyMaintenanceFee || 3500) : 0;
      const totalDue = maintenanceDue + chargeDue;
      return {
        ...u,
        totalDue,
        hasPendingCharges: chargeDue > 0,
        currentDueStatus: totalDue > 0 ? (u.currentDueStatus === 'OVERDUE' ? 'OVERDUE' : 'PENDING') : 'PAID'
      };
    });

    res.json({ success: true, units: enrichedUnits });
  } catch (err) {
    next(err);
  }
};

const raiseFund = async (req, res, next) => {
  try {
    const { targetType, amount, description } = req.body;
    
    let query = { role: 'RESIDENT' };
    if (targetType === 'OWNER' || targetType === 'TENANT') {
      query.residentType = targetType;
    }

    const users = await User.find(query);
    
    const charges = [];
    const targetUnitNumbers = new Set();
    for (const user of users) {
      if (user.unitNumber) {
        charges.push({
          unitNumber: user.unitNumber,
          description,
          amount: Number(amount),
          targetResidentType: targetType || 'ALL',
          status: 'PENDING'
        });
        targetUnitNumbers.add(user.unitNumber);
      }
    }

    if (charges.length > 0) {
      await UnitCharge.insertMany(charges);
      
      // Update target units to PENDING status so that it immediately reflects across all logins
      await Unit.updateMany(
        { unitNumber: { $in: Array.from(targetUnitNumbers) } },
        { $set: { currentDueStatus: 'PENDING' } }
      );

      // Create an announcement notice for all residents
      try {
        const notice = new SocietyNotice({
          title: `Special Fund: ${description}`,
          content: `A special fund levy of ₹${Number(amount).toLocaleString()} has been raised for ${targetType === 'ALL' ? 'all society units' : targetType + 's'}. Purpose: ${description}. Please review and pay this bill under your Finances page.`,
          category: 'MAINTENANCE',
          createdBy: req.user.userId
        });
        await notice.save();
      } catch (noticeErr) {
        console.error('Failed to create society notice for fund raise:', noticeErr);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: `Fund "${description}" of ₹${Number(amount).toLocaleString()} raised for ${charges.length} units.`, 
      count: charges.length 
    });
  } catch (err) {
    next(err);
  }
};

const getUnitLedger = async (req, res, next) => {
  try {
    const { unitNumber } = req.params;
    const unit = await Unit.findOne({ unitNumber });
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });

    const resident = await User.findOne({ unitNumber, role: 'RESIDENT' });
    const charges = await UnitCharge.find({ unitNumber }).sort({ createdAt: -1 });
    const payments = await TreasuryTransaction.find({ unitNumber, transactionType: 'INFLOW' }).sort({ date: -1 });

    const isPending = unit.currentDueStatus !== 'PAID';
    const pendingItems = [];
    if (isPending) {
      pendingItems.push({
        id: 'monthly_maintenance',
        title: 'Monthly Maintenance Fee (September 2026)',
        description: 'Common maintenance, 24/7 security, power backup, lift AMC & water supply',
        category: 'MAINTENANCE_DUE',
        amount: unit.monthlyMaintenanceFee || 3500,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        status: unit.currentDueStatus,
        canPayIndividually: true
      });
    }

    // Add any pending UnitCharge items
    charges.filter(c => c.status === 'PENDING').forEach(c => {
      pendingItems.push({
        id: c._id,
        chargeId: c._id,
        title: c.description || 'Special Society Levy',
        description: `Special fund levy allocated to ${c.targetResidentType || 'all'} flats`,
        category: 'SPECIAL_LEVY',
        amount: c.amount,
        dueDate: c.createdAt,
        status: 'PENDING',
        canPayIndividually: true
      });
    });

    const totalPendingAmount = pendingItems.reduce((acc, item) => acc + item.amount, 0);

    res.json({
      success: true,
      unit,
      resident: resident ? {
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        residentType: resident.residentType || 'OWNER'
      } : {
        name: unit.ownerName,
        email: 'N/A',
        phone: 'N/A',
        residentType: 'OWNER'
      },
      charges,
      payments,
      pendingItems,
      totalPendingAmount
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTransactions, createTransaction, payDues, getUnitStatus, raiseFund, getUnitLedger };
