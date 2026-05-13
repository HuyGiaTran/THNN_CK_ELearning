const express = require("express");
const mongoose = require("mongoose");
const courseModel = require("../models/courses.model");
const { VideoModel } = require("../models/video.model");
const { auth } = require("../middlewares/users.middleware");
const { canUserAccessCourseContent } = require("../helpers/courseAccess");

const videoRoute = express.Router();

videoRoute.use(auth);

async function assertTeacherOrAdminOwnsCourse(req, courseId) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { ok: false, status: 400, message: "Invalid course id" };
  }
  const course = await courseModel.findById(courseId).select("teacherId title");
  if (!course) {
    return { ok: false, status: 404, message: "Course not found" };
  }
  if (req.body.role === "admin") {
    return { ok: true, course };
  }
  if (req.body.role !== "teacher") {
    return { ok: false, status: 403, message: "Only teachers or admins can manage course videos" };
  }
  if (!course.teacherId || course.teacherId.toString() !== String(req.body.userId)) {
    return {
      ok: false,
      status: 403,
      message: "You can only manage videos for your own courses",
    };
  }
  return { ok: true, course };
}

async function assertTeacherOrAdminOwnsVideo(req, video) {
  if (req.body.role === "admin") {
    return { ok: true };
  }
  if (req.body.role !== "teacher") {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  if (video.teacherId && video.teacherId.toString() === String(req.body.userId)) {
    return { ok: true };
  }
  const course = await courseModel.findById(video.courseId).select("teacherId");
  if (
    course &&
    course.teacherId &&
    course.teacherId.toString() === String(req.body.userId)
  ) {
    return { ok: true };
  }
  return { ok: false, status: 403, message: "You cannot modify this video" };
}

// GET /videos/ — admin: all; teacher: ?user=<teacherId> their videos
videoRoute.get("/", async (req, res) => {
  const { user } = req.query;
  try {
    if (req.body.role === "admin") {
      const videos = await VideoModel.find({}).sort({ createdAt: -1 });
      return res.status(200).json(videos);
    }
    if (user && mongoose.Types.ObjectId.isValid(String(user))) {
      const videos = await VideoModel.find({
        teacherId: new mongoose.Types.ObjectId(String(user)),
      }).sort({ createdAt: -1 });
      return res.status(200).json(videos);
    }
    return res.status(401).json({ error: "You don't have access to videos" });
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

// GET /videos/teacher/course/:courseId — teacher/admin: list videos for a course (manage UI)
videoRoute.get("/teacher/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const check = await assertTeacherOrAdminOwnsCourse(req, courseId);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }
    const course = await courseModel
      .findById(courseId)
      .populate({ path: "videos", options: { sort: { createdAt: 1 } } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({
      course: {
        _id: course._id,
        title: course.title,
        teacherId: course.teacherId,
      },
      videos: course.videos || [],
    });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

// GET /videos/courseVideos/:courseId — enrolled learners + teacher/admin
videoRoute.get("/courseVideos/:courseId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const access = await canUserAccessCourseContent(req.body.userId, courseId, {
      forbiddenMessage:
        "You must be enrolled in this course to view its videos.",
    });
    if (!access.ok) {
      return res.status(access.status).json({
        message: access.message,
        ...(access.code ? { code: access.code } : {}),
      });
    }

    const course = await courseModel.findById(courseId).populate("videos");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ course });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// POST /videos/add/:courseId
videoRoute.post("/add/:courseId", async (req, res) => {
  try {
    if (req.body.role !== "admin" && req.body.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const courseId = req.params.courseId;
    const check = await assertTeacherOrAdminOwnsCourse(req, courseId);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

    const dup = await VideoModel.findOne({
      courseId,
      title: req.body.title,
      link: req.body.link,
    });
    if (dup) {
      return res.status(409).json({
        error:
          "A video with the same title and link already exists in this course",
      });
    }

    const data = { ...req.body };
    ["userId", "role", "username", "courseId"].forEach((k) => delete data[k]);

    const newVideo = new VideoModel({
      ...data,
      courseId,
      teacher: req.body.username,
      teacherId: req.body.userId,
      views: Number(req.body.views) || 0,
    });
    await newVideo.save();
    await courseModel.findByIdAndUpdate(courseId, {
      $push: { videos: newVideo._id },
    });
    return res.status(201).json({ message: "Video Added", video: newVideo });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

// PATCH /videos/update/:videoId
videoRoute.patch("/update/:videoId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
      return res.status(400).json({ message: "Invalid video id" });
    }
    const video = await VideoModel.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    const own = await assertTeacherOrAdminOwnsVideo(req, video);
    if (!own.ok) {
      return res.status(own.status).json({ message: own.message });
    }

    const { title, description, link, views, img } = req.body;
    if (title !== undefined) video.title = String(title).trim();
    if (description !== undefined) video.description = String(description);
    if (link !== undefined) video.link = String(link).trim();
    if (img !== undefined) video.img = String(img).trim();
    if (views !== undefined) video.views = Number(views) || 0;

    await video.save();
    return res.status(200).json({ message: "Video updated", video });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

// DELETE /videos/delete/:videoId
videoRoute.delete("/delete/:videoId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
      return res.status(400).json({ message: "Invalid video id" });
    }
    const video = await VideoModel.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    const own = await assertTeacherOrAdminOwnsVideo(req, video);
    if (!own.ok) {
      return res.status(own.status).json({ message: own.message });
    }

    const courseId = video.courseId;
    await VideoModel.findByIdAndDelete(video._id);
    if (courseId) {
      await courseModel.findByIdAndUpdate(courseId, {
        $pull: { videos: video._id },
      });
    }
    return res.status(200).json({ message: "Video deleted" });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

// PATCH /videos/markWatched/:videoId — Mark video as watched and update progress
// Access: all users
// FRONTEND: Call this when user finishes watching a video
videoRoute.patch("/markWatched/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.body.userId;
    const courseId = req.body.courseId;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing userId or courseId" });
    }

    // Get video to verify it exists and get course
    const video = await VideoModel.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Import UserCourseProgressModel
    const UserCourseProgressModel = require("../models/userCourseProgress.model");

    // Find or create progress record
    let progress = await UserCourseProgressModel.findOne({ userId, courseId });

    if (!progress) {
      // Get total videos for this course
      const course = await courseModel.findById(courseId).populate("videos");
      const totalVideos = course?.videos?.length || 0;

      progress = new UserCourseProgressModel({
        userId,
        courseId,
        watchedVideos: [videoId],
        totalVideos,
        progressPercentage: totalVideos > 0 ? Math.round((1 / totalVideos) * 100) : 0,
      });
    } else {
      // Check if video already watched
      if (!progress.watchedVideos.includes(videoId)) {
        progress.watchedVideos.push(videoId);
        progress.progressPercentage = Math.round(
          (progress.watchedVideos.length / progress.totalVideos) * 100
        );

        // If completed, set completedAt
        if (progress.progressPercentage === 100 && !progress.completedAt) {
          progress.completedAt = new Date();
        }
      }
    }

    await progress.save();

    res.status(200).json({
      message: "Video marked as watched",
      progress: {
        watchedCount: progress.watchedVideos.length,
        totalCount: progress.totalVideos,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.progressPercentage === 100,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});

// GET /videos/progress/:courseId — Get user's progress in a course
// Access: all users
// FRONTEND: Fetch progress to show progress bar
videoRoute.get("/progress/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.body.userId;

    const UserCourseProgressModel = require("../models/userCourseProgress.model");

    const progress = await UserCourseProgressModel.findOne({ userId, courseId });

    if (!progress) {
      // No progress yet, return 0%
      const course = await courseModel.findById(courseId).populate("videos");
      return res.status(200).json({
        progressPercentage: 0,
        watchedCount: 0,
        totalCount: course?.videos?.length || 0,
        isCompleted: false,
      });
    }

    res.status(200).json({
      progressPercentage: progress.progressPercentage,
      watchedCount: progress.watchedVideos.length,
      totalCount: progress.totalVideos,
      isCompleted: progress.progressPercentage === 100,
      completedAt: progress.completedAt,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});

// GET /videos/:videoID — single video (must stay after specific paths)
videoRoute.get("/:videoID", async (req, res) => {
  try {
    const videoID = req.params.videoID;
    if (
      videoID === "courseVideos" ||
      videoID === "add" ||
      videoID === "teacher" ||
      videoID === "update" ||
      videoID === "delete" ||
      videoID === "markWatched" ||
      videoID === "progress"
    ) {
      return res.status(404).json({ message: "Not found" });
    }
    const video = await VideoModel.find({ _id: videoID });
    return res.status(200).json({ video });
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

module.exports = { videoRoute };
