const JWT = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const cookies = req.cookies;
  if (!cookies?.accessToken)
    return res.status(401).send("Access denied. no token provided");

  const token = cookies.accessToken.split(" ")[1];
  try {
    req.user = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
