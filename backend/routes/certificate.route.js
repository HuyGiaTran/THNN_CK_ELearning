const express = require('express');
const CertificateModel = require('../models/certificate.model');
const { UserModel } = require('../models/users.models');
const courseModel = require('../models/courses.model');
const CourseQuizModel = require('../models/courseQuiz.model');
const { auth } = require('../middlewares/users.middleware');
const { generateCertificatePDF } = require('../utils/certificateGenerator');

const certificateRoute = express.Router();

certificateRoute.use(auth);

// POST /certificates/generate - Generate certificate after quiz is passed
// Access: all users (called after quiz submission)
// FRONTEND: Backend auto-triggers after successful quiz submission
certificateRoute.post('/generate', async (req, res) => {
  try {
    const { userId, courseId, quizId, quizScore, totalPoints } = req.body;

    // Validate inputs
    if (!userId || !courseId || !quizId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate course exists
    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Validate quiz exists
    const quiz = await CourseQuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if user already has certificate for this course
    const existingCert = await CertificateModel.findOne({ userId, courseId });
    if (existingCert) {
      return res.status(400).json({ 
        error: 'User already has a certificate for this course',
        certificate: existingCert 
      });
    }

    // Create certificate
    const certificate = new CertificateModel({
      userId,
      courseId,
      quizId,
      courseName: course.title,
      studentName: user.name,
      quizScore: Math.round(quizScore),
      totalPoints,
      certificateNumber: `CERT-${Date.now()}-${userId.substring(18)}`
    });

    await certificate.save();

    // Add certificate to user's certificates array
    await UserModel.findByIdAndUpdate(
      userId,
      { $push: { certificates: certificate._id } },
      { new: true }
    );

    res.status(201).json({ 
      message: 'Certificate generated successfully',
      certificate 
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// GET /certificates/user/:userId - Get all certificates for a user
// Access: user can see own, admin can see all
// FRONTEND: Display all certificates on user's certificate page
certificateRoute.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.body.userId;
    const userRole = req.body.role;

    // Check authorization: user can only see their own, admin can see all
    if (requestUserId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get user with populated certificates
    const user = await UserModel.findById(userId)
      .populate({
        path: 'certificates',
        populate: [
          { path: 'courseId', select: 'title img' },
          { path: 'quizId', select: 'title' }
        ]
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      certificates: user.certificates || [],
      total: (user.certificates || []).length 
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// GET /certificates/:certificateId - Get certificate details
// Access: owner, admin
// FRONTEND: View certificate on modal/page
certificateRoute.get('/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const requestUserId = req.body.userId;
    const userRole = req.body.role;

    const certificate = await CertificateModel.findById(certificateId)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('quizId', 'title');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check authorization
    if (certificate.userId._id.toString() !== requestUserId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.status(200).json({ certificate });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// GET /certificates/:certificateId/download - Download certificate as PDF
// Access: owner, admin
// FRONTEND: Download button on certificate card
certificateRoute.get('/:certificateId/download', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const requestUserId = req.body.userId;
    const userRole = req.body.role;

    const certificate = await CertificateModel.findById(certificateId)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('quizId', 'title');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check authorization
    if (certificate.userId._id.toString() !== requestUserId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificate);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${certificate.certificateNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

// DELETE /certificates/:certificateId - Delete certificate (admin only)
// Access: admin
certificateRoute.delete('/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userRole = req.body.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete certificates' });
    }

    const certificate = await CertificateModel.findByIdAndDelete(certificateId);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Remove from user's certificates array
    await UserModel.findByIdAndUpdate(
      certificate.userId,
      { $pull: { certificates: certificateId } }
    );

    res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = { certificateRoute };
