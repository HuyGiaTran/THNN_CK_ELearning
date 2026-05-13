const mongoose = require('mongoose');

// Track user's progress in each course
const userCourseProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'course',
      required: true,
      index: true,
    },
    watchedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'videos',
      },
    ],
    totalVideos: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one progress record per user per course
userCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserCourseProgressModel = mongoose.model(
  'userCourseProgress',
  userCourseProgressSchema
);

module.exports = UserCourseProgressModel;
