const mongoose = require('mongoose');

// Schema for quiz questions
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: 'Must have exactly 4 options (A, B, C, D)'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3]
  }
});

// Quiz schema
const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: (v) => v.length > 0,
      message: 'Quiz must have at least one question'
    }
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: function() {
      return this.questions.length * 10;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const QuizModel = mongoose.model('quiz', quizSchema);

module.exports = QuizModel;
