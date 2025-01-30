const express = require("express");
const bcrypt = require("bcrypt");
const auth = require("../middlewares/auth");
const JWT = require("jsonwebtoken");
const _ = require("lodash");
const { User, validate } = require("../models/user");
const validateLogin = require("../models/auth");
const { validateRefreshToken, Refresh } = require("../models/refresh");
router = express.Router();

router.post("/signup", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["username", "email", "password", "role"]));

  user.password = await bcrypt.hash(user.password, 10);

  await user.save();

  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokens(payload);

  const newRefresh = new Refresh({
    userId: user._id,
    token: tokens.refresh_token,
  });
  await newRefresh.save();

  const { _id, username, email, role } = user;
  res.send({ _id, username, email, role, ...tokens });
});

router.post("/login", async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).send("Invaliddd Credintals.");

  const isValidPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isValidPassword) return res.status(401).send("Invalid Credintals.");

  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokens(payload);

  let refreshToken = await Refresh.findOne({
    userId: user._id,
  });

  if (!refreshToken) {
    refreshToken = new Refresh({
      userId: user._id,
      token: tokens.refresh_token,
    });
  } else {
    refreshToken.token = tokens.refresh_token;
  }

  await refreshToken.save();

  const { _id, username, email, role } = user;

  //Send as tokens as plain response
  // res.send({ _id, username, email, role, ...tokens });

  //Send tokens alongside headers
  // res
  //   .header("accessToken", tokens.access_token)
  //   .header("refreshToken", tokens.refresh_token)
  //   .send({ _id, username, email, role });

  //Send tokens as secure / httpOnly cookie
  res
    .cookie("accessToken", tokens.access_token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .send({ _id, username, email, role });
});

router.post("/refresh", auth, async (req, res) => {
  const { error } = validateRefreshToken(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const refreshToken = await Refresh.findOne({
    userId: req.body.userId,
    token: req.body.token,
  });
  if (!refreshToken) return res.status(400).send("Inavlid token.");

  const user = await User.findById(req.body.userId);

  const payload = {
    sub: req.body.userId,
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokens(payload);

  refreshToken.token = tokens.refresh_token;
  await refreshToken.save();

  res.send(tokens);
});

router.put("/logout/:id", auth, async (req, res) => {
  const refreshToken = await Refresh.findOne({
    userId: req.params.id,
  });
  if (!refreshToken) return res.status(400).send("User already logout.");

  refreshToken.token = "";
  await refreshToken.save();

  res.sendStatus(200);
});

function generateTokens(payload) {
  const AccessToken = JWT.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = JWT.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "5d",
  });

  return {
    access_token: `Bearer ${AccessToken}`,
    refresh_token: `Bearer ${refreshToken}`,
  };
}

module.exports = router;
