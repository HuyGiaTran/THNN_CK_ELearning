/*
const mongoose = require("mongoose");
require("dotenv").config();

// Use environment variable for MongoDB URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning';

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("Database connected");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

const db = mongoose.connection;

db.on("error", (error) => console.error("MongoDB Connection Error:", error));
db.once("open", () => console.log("Connected to MongoDB"));


module.exports = {
    db
};
*/
require("dotenv").config(); // Đảm bảo dòng này có mặt để đọc file .env
const mongoose = require("mongoose");

// Lấy link từ .env, nếu không có sẽ báo lỗi rõ ràng thay vì dùng localhost
const mongoURI = process.env.MONGODB_URI; 

if (!mongoURI) {
    console.error("LỖI: Biến MONGODB_URI không tồn tại trong file .env!");
    process.exit(1); // Dừng chương trình nếu không có link database
}

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("--- Đã kết nối thành công tới MongoDB Atlas (Cloud) ---");
    })
    .catch((err) => {
        console.error("Lỗi kết nối Database:", err);
    });

const db = mongoose.connection;
module.exports = { db };