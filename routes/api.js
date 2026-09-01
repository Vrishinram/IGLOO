const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProjectData = require('../models/ProjectData');

// @route   GET /api/health
// @desc    Check server & database connection health
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    status: 'online',
    project: 'GLUE',
    team: 'AURA',
    database: {
      status: states[dbState] || 'Unknown',
      readyState: dbState
    },
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/data
// @desc    Get all items from MongoDB
router.get('/data', async (req, res) => {
  try {
    const items = await ProjectData.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/data
// @desc    Create new item in MongoDB
router.post('/data', async (req, res) => {
  try {
    const { title, description, createdBy, status, tags } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const newItem = await ProjectData.create({
      title,
      description,
      createdBy: createdBy || 'Team AURA',
      status: status || 'pending',
      tags: tags || []
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/data/:id
// @desc    Delete item from MongoDB
router.delete('/data/:id', async (req, res) => {
  try {
    const item = await ProjectData.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
