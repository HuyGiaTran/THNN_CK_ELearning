const express = require('express');
const { auth } = require('../middlewares/users.middleware');
const { queryAIAssistant } = require('../helpers/aiAssistant.helper');
const { canUserAccessCourseContent } = require('../helpers/courseAccess');

const aiAssistantRoute = express.Router();

/**
 * POST /ai-assistant/ask
 * Send a question to AI Assistant
 * 
 * Request body:
 * {
 *   courseId: string (MongoDB ObjectId of course),
 *   question: string (User's question)
 * }
 * 
 * Response:
 * {
 *   response: string (AI Assistant's answer),
 *   isWithinContext: boolean (Whether answer is within course material),
 *   tokens: number (OpenAI tokens used)
 * }
 */
aiAssistantRoute.post('/ask', auth, async (req, res) => {
  try {
    const { courseId, question } = req.body;
    const userId = req.body.userId;

    // Validation
    if (!courseId || !question) {
      return res.status(400).json({
        message: 'Missing required fields: courseId and question',
      });
    }

    if (question.trim().length === 0) {
      return res.status(400).json({
        message: 'Question cannot be empty',
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        message: 'Question is too long (max 1000 characters)',
      });
    }

    // Check if user has access to this course
    const access = await canUserAccessCourseContent(userId, courseId, {
      forbiddenMessage: 'You must be enrolled in this course to use AI Assistant.',
    });

    if (!access.ok) {
      return res.status(access.status).json({
        message: access.message,
        ...(access.code ? { code: access.code } : {}),
      });
    }

    // Query AI Assistant with RAG
    const result = await queryAIAssistant(courseId, question);

    res.status(200).json({
      success: true,
      question: question,
      response: result.response,
      isWithinContext: result.isWithinContext,
      tokensUsed: result.tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Assistant Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process your question',
      error: error.message,
    });
  }
});

/**
 * POST /ai-assistant/upload-pdf
 * Upload course material PDF (Admin/Teacher only)
 * 
 * This endpoint allows teachers to upload course material PDFs
 * which will be used for RAG context
 */
aiAssistantRoute.post('/upload-pdf', auth, async (req, res) => {
  try {
    const { role } = req.body;

    // Only admin and teacher can upload
    if (role !== 'admin' && role !== 'teacher') {
      return res.status(403).json({
        message: 'Only admin and teachers can upload course materials',
      });
    }

    // TODO: Implement file upload logic with multer
    // For now, we'll return a placeholder response
    res.status(200).json({
      message: 'PDF upload endpoint - to be implemented with multer',
      hint: 'Use formData with file field to upload PDF',
    });
  } catch (error) {
    console.error('PDF Upload Error:', error.message);
    res.status(500).json({
      message: 'Failed to upload PDF',
      error: error.message,
    });
  }
});

module.exports = { aiAssistantRoute };
