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
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        message: 'MONGODB_URI is not configured in Vercel environment variables.'
      });
    }

    const { role, email } = req.body;
    let user;
    if (email) {
      user = await User.findOne({ isDemoUser: true, email });
    } else {
      user = await User.findOne({ isDemoUser: true, role });
    }
    
    // Auto-seed if database is empty / demo user is not yet created
    if (!user) {
      console.log('Demo user not found. Attempting automatic database seeding...');
      try {
        await seedDatabase();
        if (email) {
          user = await User.findOne({ isDemoUser: true, email });
        } else {
          user = await User.findOne({ isDemoUser: true, role });
        }
      } catch (seedErr) {
        console.error('Auto-seed failed:', seedErr);
        return res.status(500).json({
          success: false,
          message: `Auto-seed failed: ${seedErr.message}. Ensure IP 0.0.0.0/0 is allowed in MongoDB Atlas Network Access.`
        });
      }
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo user not found after seeding.' });
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
