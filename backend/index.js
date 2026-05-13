const express = require("express");
const { connection } = require("./db");
const { userRouter } = require("./routes/users.routes");
const { courseRoute } = require("./routes/courses.route");
const { videoRoute } = require("./routes/videos.route");
const { quizRoute } = require("./routes/quiz.route");
const { certificateRoute } = require("./routes/certificate.route");

const cors = require('cors')


require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors())


app.use(express.json());

app.use("/users", userRouter);

app.use("/courses", courseRoute);

app.use("/videos", videoRoute);

app.use("/quiz", quizRoute);

app.use("/certificates", certificateRoute);

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

app.get('/',(req,res)=>{
  try{
    res.status(200).json({message:"Welcome to SRM's Backend"})
  }catch(err){
    res.status(400).json({ message: "Some Error Occur. Please Refresh" });
  }
})


const PORT = process.env.PORT || 5001; 

app.listen(PORT, async () => {
  try {
    await connection; // Biến connection từ db.js
    console.log(`--- connected to db ---`);
    console.log(`--- connected to port: ${PORT} ---`);
  } catch (error) {
    console.log(`error: ${error}`);
  }
});
