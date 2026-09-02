const express = require('express');
const router = express.Router();
const SocietyNotice = require('../models/SocietyNotice');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notices = await SocietyNotice.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
