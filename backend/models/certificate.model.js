const crypto = require('crypto');
const mongoose = require('mongoose');

// Certificate schema
const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    default: () => crypto.randomUUID().substring(0, 8).toUpperCase()
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'course',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'quiz',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  quizScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  certificateNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CertificateModel = mongoose.model('certificate', certificateSchema);

module.exports = CertificateModel;
