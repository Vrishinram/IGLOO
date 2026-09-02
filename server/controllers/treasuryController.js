const TreasuryTransaction = require('../models/TreasuryTransaction');
const Unit = require('../models/Unit');
const User = require('../models/User');
const UnitCharge = require('../models/UnitCharge');

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
        if (t.date >= startOfMonth) currentMonthInflow += t.amount;
      } else {
        totalBalance -= t.amount;
        if (t.date >= startOfMonth) currentMonthOutflow += t.amount;
      }
      
      if (!categoryBreakdown[t.category]) categoryBreakdown[t.category] = 0;
      categoryBreakdown[t.category] += (t.transactionType === 'INFLOW' ? t.amount : -t.amount);
    });

    res.json({ success: true, totalBalance, currentMonthInflow, currentMonthOutflow, categoryBreakdown });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await TreasuryTransaction.find().sort({ date: -1 }).populate('loggedBy', 'name');
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { transactionType, category, amount, description, unitNumber, vendorName } = req.body;
    const tx = new TreasuryTransaction({
      transactionType,
      category,
      amount,
      description,
      unitNumber,
      loggedBy: req.user.userId,
      vendorName
    });
    await tx.save();
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};

const payDues = async (req, res, next) => {
  try {
    const targetUnit = req.body.unitNumber || req.user.unitNumber;
    if (!targetUnit) return res.status(400).json({ success: false, message: 'Unit number is required' });

    const unit = await Unit.findOne({ unitNumber: targetUnit });
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    const amount = req.body.amount || unit.monthlyMaintenanceFee || 3500;
    
    const tx = new TreasuryTransaction({
      transactionType: 'INFLOW',
      category: 'MAINTENANCE_DUE',
      amount,
      description: `Maintenance fee payment for ${unit.unitNumber}`,
      unitNumber: unit.unitNumber,
      loggedBy: req.user.userId
    });
    await tx.save();
    
    unit.currentDueStatus = 'PAID';
    unit.lastPaidDate = new Date();
    await unit.save();
    
    res.json({ success: true, message: `Dues for unit ${unit.unitNumber} marked as paid successfully`, transaction: tx, unit });
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
    const units = await Unit.find(query).sort({ unitNumber: 1 });
    res.json({ success: true, units });
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
    for (const user of users) {
      if (user.unitNumber) {
        charges.push({
          unitNumber: user.unitNumber,
          description,
          amount,
          targetResidentType: targetType,
          status: 'PENDING'
        });
      }
    }

    if (charges.length > 0) {
      await UnitCharge.insertMany(charges);
    }

    res.status(201).json({ success: true, message: `Fund raised for ${charges.length} units.`, count: charges.length });
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
        title: 'Monthly Maintenance Fee (September 2026)',
        description: 'Common maintenance, 24/7 security, power backup, lift AMC & water supply',
        category: 'MAINTENANCE_DUE',
        amount: unit.monthlyMaintenanceFee || 3500,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        status: unit.currentDueStatus
      });
    }

    // Add any pending UnitCharge items
    charges.filter(c => c.status === 'PENDING').forEach(c => {
      pendingItems.push({
        title: c.description || 'Special Society Levy',
        description: `Special fund levy allocated to ${c.targetResidentType || 'all'} flats`,
        category: 'SPECIAL_LEVY',
        amount: c.amount,
        dueDate: c.createdAt,
        status: 'PENDING'
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
