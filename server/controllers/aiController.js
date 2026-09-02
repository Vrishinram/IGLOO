const aiService = require('../services/aiService');
const TreasuryTransaction = require('../models/TreasuryTransaction');

const triageIssue = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    
    const analysis = await aiService.triageMaintenanceIssue(title, description);
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
};

const auditFinances = async (req, res, next) => {
  try {
    const transactions = await TreasuryTransaction.find().lean();
    
    let totalBalance = 0;
    transactions.forEach(t => {
      if (t.transactionType === 'INFLOW') totalBalance += t.amount;
      else totalBalance -= t.amount;
    });
    
    const analysis = await aiService.auditTreasuryData(transactions, totalBalance);
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
};

const generateNotice = async (req, res, next) => {
  try {
    const { rawNotes, category } = req.body;
    if (!rawNotes || !category) return res.status(400).json({ success: false, message: 'rawNotes and category required' });
    
    const notice = await aiService.formatSocietyNotice(rawNotes, category);
    res.json({ success: true, notice });
  } catch (err) {
    next(err);
  }
};

module.exports = { triageIssue, auditFinances, generateNotice };
