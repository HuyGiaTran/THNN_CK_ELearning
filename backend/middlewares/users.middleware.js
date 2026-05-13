const jwt = require("jsonwebtoken");
const { blacklist } = require("../blacklist");

const auth = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Please Login" });
  }

  try {
    if (blacklist.includes(token)) {
      return res.status(401).json({ msg: "Please Login Again" });
    }

    const decoded = jwt.verify(token, "SRM");
    req.body.username = decoded.user;
    req.body.userId = decoded.userId;
    req.body.role = decoded.role;
    return next();
  } catch (error) {
    return res.status(401).json({ msg: "not authorized" });
  }
};

module.exports = {
  auth,
};
