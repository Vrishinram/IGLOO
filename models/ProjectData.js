const mongoose = require('mongoose');

const ProjectDataSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      default: 'Team AURA'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProjectData', ProjectDataSchema);
