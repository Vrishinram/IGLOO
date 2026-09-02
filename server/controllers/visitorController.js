const VisitorPass = require('../models/VisitorPass');
const User = require('../models/User');

const getPasses = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'RESIDENT') {
      query.hostUserId = req.user.userId;
    } else if (req.user.role === 'SECURITY' || req.user.role === 'ADMIN') {
      query.status = { $in: ['PRE_APPROVED', 'INSIDE', 'COMPLETED'] };
    }
    
    const passes = await VisitorPass.find(query).sort({ expectedDate: -1 }).populate('hostUserId', 'name unitNumber');
    res.json({ success: true, passes });
  } catch (err) {
    next(err);
  }
};

const createPass = async (req, res, next) => {
  try {
    const { visitorName, visitorPhone, purpose, vehicleNumber, expectedDate, unitNumber } = req.body;
    
    const targetUnit = unitNumber || req.user.unitNumber;
    if (!targetUnit) {
      return res.status(400).json({ success: false, message: 'Please select a host unit number.' });
    }

    let hostId = req.user.userId;
    if (req.user.role === 'SECURITY' || req.user.role === 'ADMIN') {
      const resident = await User.findOne({ unitNumber: targetUnit, role: 'RESIDENT' });
      if (resident) {
        hostId = resident._id;
      }
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const passCode = `IG-${randomCode}`;
    
    const pass = new VisitorPass({
      passCode,
      unitNumber: targetUnit,
      hostUserId: hostId,
      visitorName,
      visitorPhone,
      purpose: purpose || 'GUEST',
      vehicleNumber: vehicleNumber || '',
      expectedDate: expectedDate || new Date()
    });
    
    await pass.save();
    res.status(201).json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

const verifyCode = async (req, res, next) => {
  try {
    const { code, phone } = req.body;
    let query = {};
    if (code) query.passCode = code;
    else if (phone) query.visitorPhone = phone;
    else return res.status(400).json({ success: false, message: 'Provide code or phone' });
    
    const pass = await VisitorPass.findOne(query).populate('hostUserId', 'name unitNumber');
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });
    
    res.json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const { passId } = req.body;
    const pass = await VisitorPass.findByIdAndUpdate(
      passId,
      { status: 'INSIDE', checkInTime: new Date(), verifiedByGuard: req.user.userId },
      { new: true }
    );
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });
    res.json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const { passId } = req.body;
    const pass = await VisitorPass.findByIdAndUpdate(
      passId,
      { status: 'COMPLETED', checkOutTime: new Date() },
      { new: true }
    );
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });
    res.json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPasses, createPass, verifyCode, checkIn, checkOut };
