require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db");
const { userRouter } = require("./routes/users.routes");
const { courseRoute } = require("./routes/courses.route");
const { videoRoute } = require("./routes/videos.route");
const { quizRoute, quizRouter } = require("./routes/quiz.route");
const { certificateRoute } = require("./routes/certificate.route");
const { paymentRoute } = require("./routes/payment.route");

const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/users", userRouter);

app.use("/courses", courseRoute);

app.use("/videos", videoRoute);

app.use("/quiz", quizRoute);

app.use("/quizzes", quizRouter);

app.use("/certificates", certificateRoute);

app.use("/payment", paymentRoute);

app.get("/regenerateToken", (req, res) => {
  const rToken = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(rToken, "ARIVU");

  if (decoded) {
    const token = jwt.sign(
      { userId: decoded.userId, user: decoded.user },
      "arivu",
      {
        expiresIn: "7d",
      }
    );
    res.status(201).json({ msg: "token created", token });
  } else {
    res.status(400).json({ msg: "not a valid Refresh Token" });
  }
});

app.get("/", (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to SRM's Backend" });
  } catch (err) {
    res.status(400).json({ message: "Some Error Occur. Please Refresh" });
  }
});

const PORT = Number(process.env.PORT) || 5001;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`--- connected to port: ${PORT} ---`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use (EADDRINUSE). Set a different PORT in your environment, e.g. PORT=5002 npm start`
        );
      } else {
        console.error("Server failed to start:", err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
