const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { seedDatabase } = require('../utils/seedData');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role, unitNumber: user.unitNumber, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

const quickDemoLogin = async (req, res, next) => {
  try {
    const { role, email } = req.body;
    let user;
    if (email) {
      user = await User.findOne({ isDemoUser: true, email });
    } else {
      user = await User.findOne({ isDemoUser: true, role });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo user not found' });
    }
    
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

const resetDatabase = async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    next(err);
  }
};

const getTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.find({ role: 'TECHNICIAN' });
    res.json({ success: true, technicians });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, quickDemoLogin, resetDatabase, getTechnicians };
