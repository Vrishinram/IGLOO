const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, unitNumber, residentType, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      unitNumber: unitNumber || null,
      residentType: residentType || null,
      phone
    });

    res.status(201).json({ success: true, data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    } });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
