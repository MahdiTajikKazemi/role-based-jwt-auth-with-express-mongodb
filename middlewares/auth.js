const JWT = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader)
    return res.status(401).send("Access denied. no token provided");

  const token = authHeader.split(" ")[1];
  try {
    req.user = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
