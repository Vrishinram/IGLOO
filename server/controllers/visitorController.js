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

    // Ensure unique passCode
    let passCode = '';
    let exists = true;
    while (exists) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      passCode = `IG-${randomCode}`;
      exists = await VisitorPass.exists({ passCode });
    }
    
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
    if (!code && !phone) {
      return res.status(400).json({ success: false, message: 'Please provide a pass code, phone number, or unit number.' });
    }

    const inputRaw = (code || phone || '').toString().trim();
    if (!inputRaw) {
      return res.status(400).json({ success: false, message: 'Please provide a pass code or phone number.' });
    }

    const cleanInput = inputRaw.toUpperCase().replace(/\s+/g, '');
    const cleanDigits = inputRaw.replace(/\D/g, ''); // only numbers

    // Assemble passCode match variations (e.g. 7824, IG-7824, IG7824, ig-7824)
    const passCodeCandidates = new Set([
      inputRaw.toUpperCase(),
      cleanInput,
      cleanInput.startsWith('IG-') ? cleanInput : `IG-${cleanInput.replace(/^IG-?/, '')}`
    ]);
    if (cleanDigits) {
      passCodeCandidates.add(`IG-${cleanDigits}`);
      passCodeCandidates.add(cleanDigits);
    }

    // Build flexible search criteria:
    // 1. Pass code match
    // 2. Exact phone match
    const orConditions = [
      { passCode: { $in: Array.from(passCodeCandidates) } },
      { visitorPhone: cleanInput }
    ];

    if (cleanDigits && cleanDigits.length >= 4) {
      orConditions.push({ visitorPhone: cleanDigits });
      orConditions.push({ visitorPhone: { $regex: cleanDigits, $options: 'i' } });
    }

    // 3. Unit number match (e.g. A-101, B-201, A101)
    const unitMatch = cleanInput.match(/^([AB])-?(\d{3})$/);
    if (unitMatch) {
      const formattedUnit = `${unitMatch[1]}-${unitMatch[2]}`;
      orConditions.push({ 
        unitNumber: formattedUnit, 
        status: { $in: ['PRE_APPROVED', 'INSIDE'] } 
      });
    }

    const pass = await VisitorPass.findOne({ $or: orConditions })
      .sort({ createdAt: -1 })
      .populate('hostUserId', 'name unitNumber phone');

    if (!pass) {
      return res.status(404).json({ 
        success: false, 
        message: `No visitor pass found matching "${inputRaw}". Please verify the pass code or visitor phone number.` 
      });
    }
    
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
