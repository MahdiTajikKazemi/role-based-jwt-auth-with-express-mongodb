const JWT = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).send("Access denied. no token provided");

  try {
    req.user = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
