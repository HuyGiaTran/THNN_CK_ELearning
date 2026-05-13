const express = require("express");
const mongoose = require("mongoose");
const { auth } = require("../middlewares/users.middleware");
const { canUserAccessCourseContent } = require("../helpers/courseAccess");
const courseModel = require("../models/courses.model");
const CourseQuizModel = require("../models/courseQuiz.model");
const { VideoModel } = require("../models/video.model");
const { QuizModel } = require("../models/quiz.model");
const { SubmissionModel } = require("../models/submission.model");

/* ---------- Course-level quiz (/quiz) — certificate / final exam ---------- */

const quizRoute = express.Router();

const checkTeacherOrAdmin = (req, res, next) => {
  if (req.body.role !== "teacher" && req.body.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only teachers or admins can create quizzes" });
  }
  next();
};

quizRoute.use(auth);

quizRoute.post("/add/:courseId", checkTeacherOrAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, questions, passingScore } = req.body;

    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ error: "Quiz must have at least one question" });
    }

    const existingQuiz = await CourseQuizModel.findOne({ courseId });
    if (existingQuiz) {
      return res.status(400).json({ error: "This course already has a quiz" });
    }

    const quiz = new CourseQuizModel({
      courseId,
      title: title || "Course Quiz",
      description: description || "",
      questions,
      passingScore: passingScore || 70,
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRoute.get("/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const quiz = await CourseQuizModel.findOne({ courseId });
    if (!quiz) {
      return res.status(404).json({ error: "No quiz found for this course" });
    }

    res.status(200).json({ quiz });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRoute.post("/submit/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    const quiz = await CourseQuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        error: `Expected ${quiz.questions.length} answers, got ${answers.length}`,
      });
    }

    let correctCount = 0;
    const detailedResults = quiz.questions.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) correctCount += 1;

      return {
        questionIndex: index,
        question: question.questionText,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
    });

    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    res.status(200).json({
      message: passed
        ? "Quiz passed! Certificate will be generated."
        : "Quiz failed. Try again.",
      score: Math.round(score),
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      passingScore: quiz.passingScore,
      details: detailedResults,
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRoute.get("/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await CourseQuizModel.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json({ quiz });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRoute.patch("/:quizId", checkTeacherOrAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, questions, passingScore } = req.body;

    const quiz = await CourseQuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ error: "Quiz must have at least one question" });
    }

    quiz.title = title || quiz.title;
    quiz.description = description || "";
    quiz.questions = questions;
    quiz.passingScore = passingScore || 70;
    quiz.updatedAt = Date.now();
    quiz.totalPoints = quiz.questions.length * 10;

    await quiz.save();
    res.status(200).json({ message: "Quiz updated successfully", quiz });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRoute.delete("/:quizId", checkTeacherOrAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await CourseQuizModel.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

/* ---------- Video-level lesson quizzes (/quizzes) ---------- */

const quizRouter = express.Router();

quizRouter.use(auth);

function validateQuestionsPayload(questions) {
  if (!Array.isArray(questions) || questions.length < 1) {
    return "questions must be a non-empty array";
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || typeof q.prompt !== "string" || !q.prompt.trim()) {
      return `questions[${i}].prompt is required`;
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      return `questions[${i}].choices must have at least 2 options`;
    }
    if (
      typeof q.correctIndex !== "number" ||
      !Number.isInteger(q.correctIndex)
    ) {
      return `questions[${i}].correctIndex must be an integer`;
    }
    if (q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
      return `questions[${i}].correctIndex out of range`;
    }
  }
  return null;
}

async function canCreateQuizForVideo(userId, role, video) {
  if (role === "admin") {
    return { ok: true };
  }
  if (role !== "teacher") {
    return {
      ok: false,
      status: 403,
      message: "Only admins and authorized teachers can create quizzes.",
    };
  }
  const course = await courseModel
    .findById(video.courseId)
    .select("teacherId");
  if (!course) {
    return { ok: false, status: 404, message: "Course not found" };
  }
  const uid = userId;
  const ownsCourse = course.teacherId && course.teacherId.equals(uid);
  const ownsVideo = video.teacherId && video.teacherId.equals(uid);
  if (ownsCourse || ownsVideo) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    message: "You can only add a quiz to videos in courses you teach.",
  };
}

async function loadVideoForQuiz(videoId) {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    return { ok: false, status: 400, message: "Valid videoId is required" };
  }
  const video = await VideoModel.findById(videoId).select(
    "courseId teacherId"
  );
  if (!video) {
    return { ok: false, status: 404, message: "Video not found" };
  }
  return { ok: true, video };
}

quizRouter.post("/", async (req, res) => {
  try {
    const { videoId, title, questions } = req.body;
    const userId = req.body.userId;
    const role = req.body.role;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Valid videoId is required" });
    }
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const errMsg = validateQuestionsPayload(questions);
    if (errMsg) {
      return res.status(400).json({ message: errMsg });
    }

    const videoIdObj = new mongoose.Types.ObjectId(String(videoId));
    const video = await VideoModel.findById(videoIdObj).select(
      "courseId teacherId"
    );
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const createPerm = await canCreateQuizForVideo(userId, role, video);
    if (!createPerm.ok) {
      return res
        .status(createPerm.status)
        .json({ message: createPerm.message });
    }

    const mappedQuestions = questions.map((q) => ({
      prompt: q.prompt.trim(),
      choices: q.choices.map((c) => String(c)),
      correctIndex: q.correctIndex,
    }));

    const hadQuiz = Boolean(await QuizModel.exists({ videoId: videoIdObj }));

    const quiz = await QuizModel.findOneAndUpdate(
      { videoId: videoIdObj },
      {
        $set: {
          videoId: videoIdObj,
          courseId: video.courseId,
          title: title.trim(),
          questions: mappedQuestions,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(hadQuiz ? 200 : 201).json({
      message: hadQuiz ? "Quiz updated" : "Quiz created",
      quiz,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate key on quiz (thường do index cũ unique theo course). Khởi động lại server để syncIndexes, hoặc trong MongoDB chạy db.quizzes.getIndexes() và drop index trùng courseId.",
        error: err.message,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
      });
    }
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRouter.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const loaded = await loadVideoForQuiz(videoId);
    if (!loaded.ok) {
      return res.status(loaded.status).json({ message: loaded.message });
    }
    const { video } = loaded;

    const access = await canUserAccessCourseContent(
      req.body.userId,
      String(video.courseId),
      {
        forbiddenMessage:
          "You must be enrolled in this course to access the quiz.",
      }
    );
    if (!access.ok) {
      return res.status(access.status).json({
        message: access.message,
        ...(access.code ? { code: access.code } : {}),
      });
    }

    const vid = new mongoose.Types.ObjectId(String(videoId));
    const quiz = await QuizModel.findOne({ videoId: vid });
    if (!quiz) {
      return res.status(404).json({ message: "No quiz for this lesson." });
    }

    const safe = {
      _id: quiz._id,
      title: quiz.title,
      questions: quiz.questions.map((q) => ({
        prompt: q.prompt,
        choices: q.choices,
      })),
    };
    res.status(200).json({ quiz: safe });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

quizRouter.post("/video/:videoId/submit", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { answers } = req.body;

    const loaded = await loadVideoForQuiz(videoId);
    if (!loaded.ok) {
      return res.status(loaded.status).json({ message: loaded.message });
    }
    const { video } = loaded;
    const courseIdStr = String(video.courseId);

    const access = await canUserAccessCourseContent(
      req.body.userId,
      courseIdStr,
      {
        forbiddenMessage:
          "You must be enrolled in this course to submit the quiz.",
      }
    );
    if (!access.ok) {
      return res.status(access.status).json({
        message: access.message,
        ...(access.code ? { code: access.code } : {}),
      });
    }

    const vid = new mongoose.Types.ObjectId(String(videoId));
    const quiz = await QuizModel.findOne({ videoId: vid });
    if (!quiz) {
      return res.status(404).json({ message: "No quiz for this lesson." });
    }

    const qs = quiz.questions;
    if (!Array.isArray(answers) || answers.length !== qs.length) {
      return res.status(400).json({
        message: `answers must be an array of length ${qs.length} (one index per question).`,
      });
    }

    let correct = 0;
    for (let i = 0; i < qs.length; i++) {
      const a = answers[i];
      if (typeof a !== "number" || !Number.isInteger(a)) {
        return res.status(400).json({
          message: `answers[${i}] must be an integer choice index.`,
        });
      }
      if (a < 0 || a >= qs[i].choices.length) {
        return res.status(400).json({
          message: `answers[${i}] is out of range for that question's choices.`,
        });
      }
      if (a === qs[i].correctIndex) {
        correct += 1;
      }
    }

    const total = qs.length;
    const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

    const submission = await SubmissionModel.create({
      userId: req.body.userId,
      videoId: quiz.videoId,
      courseId: video.courseId,
      quizId: quiz._id,
      score: percent,
      answers,
    });

    res.status(200).json({
      message: "Submitted",
      score: correct,
      total,
      percent,
      submissionId: submission._id,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = { quizRoute, quizRouter };
