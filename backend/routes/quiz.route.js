const express = require('express');
const QuizModel = require('../models/quiz.model');
const { auth } = require('../middlewares/users.middleware');
const courseModel = require('../models/courses.model');

const quizRoute = express.Router();

// Middleware to check if user is teacher or admin
const checkTeacherOrAdmin = (req, res, next) => {
  if (req.body.role !== 'teacher' && req.body.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can create quizzes' });
  }
  next();
};

quizRoute.use(auth);

// POST /quiz/add/:courseId - Create a new quiz for a course
// Access: teacher, admin
// FRONTEND: Teacher can add quiz to their course
quizRoute.post('/add/:courseId', checkTeacherOrAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, questions, passingScore } = req.body;

    // Validate course exists
    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Validate questions format
    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must have at least one question' });
    }

    // Check if quiz already exists for this course
    const existingQuiz = await QuizModel.findOne({ courseId });
    if (existingQuiz) {
      return res.status(400).json({ error: 'This course already has a quiz' });
    }

    // Create new quiz
    const quiz = new QuizModel({
      courseId,
      title: title || 'Course Quiz',
      description: description || '',
      questions,
      passingScore: passingScore || 70
    });

    await quiz.save();
    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// GET /quiz/course/:courseId - Get quiz for a specific course
// Access: all authenticated users
// FRONTEND: Users can view quiz before attempting
quizRoute.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const quiz = await QuizModel.findOne({ courseId });
    if (!quiz) {
      return res.status(404).json({ error: 'No quiz found for this course' });
    }

    res.status(200).json({ quiz });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// POST /quiz/submit/:quizId - Submit quiz answers and calculate score
// Access: all users
// FRONTEND: User submits their answers, receives score and result
quizRoute.post('/submit/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // answers = [0, 2, 1, 3, ...] (index of selected option)
    const userId = req.body.userId;

    // Validate quiz exists
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Validate answers array
    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({ 
        error: `Expected ${quiz.questions.length} answers, got ${answers.length}` 
      });
    }

    // Calculate score
    let correctCount = 0;
    const detailedResults = quiz.questions.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        question: question.questionText,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    res.status(200).json({
      message: passed ? 'Quiz passed! Certificate will be generated.' : 'Quiz failed. Try again.',
      score: Math.round(score),
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      passingScore: quiz.passingScore,
      details: detailedResults
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// GET /quiz/:quizId - Get specific quiz details
// Access: all authenticated users
quizRoute.get('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await QuizModel.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.status(200).json({ quiz });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// PATCH /quiz/:quizId - Update quiz (teacher/admin only)
// Access: teacher, admin
quizRoute.patch('/:quizId', checkTeacherOrAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, questions, passingScore } = req.body;

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Validate questions format
    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must have at least one question' });
    }

    quiz.title = title || quiz.title;
    quiz.description = description || '';
    quiz.questions = questions;
    quiz.passingScore = passingScore || 70;
    quiz.updatedAt = Date.now();
    quiz.totalPoints = quiz.questions.length * 10;

    await quiz.save();
    res.status(200).json({ message: 'Quiz updated successfully', quiz });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// DELETE /quiz/:quizId - Delete quiz (teacher/admin only)
// Access: teacher, admin
quizRoute.delete('/:quizId', checkTeacherOrAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await QuizModel.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = { quizRoute };
