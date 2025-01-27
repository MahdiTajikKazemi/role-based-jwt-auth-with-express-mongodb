const express = require("express");
const bcrypt = require("bcrypt");
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

  user = new User(_.pick(req.body, ["username", "email", "password"]));

  user.password = await bcrypt.hash(user.password, 10);

  await user.save();

  const payload = {
    sub: user._id,
    email: user.email,
  };

  const tokens = generateTokens(payload);

  const newRefresh = new Refresh({
    userId: user._id,
    token: tokens.refresh_token,
  });
  await newRefresh.save();

  res.status(201).send(tokens);
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
  };

  const tokens = generateTokens(payload);

  let refreshToken = await Refresh.findOne({
    userId: user._id,
  });

  if (!refreshToken) {
    console.log("not refresh");
    refreshToken = new Refresh({
      userId: user._id,
      token: tokens.refresh_token,
    });
  } else {
    console.log("yes refresh");
    refreshToken.token = tokens.refresh_token;
  }

  await refreshToken.save();

  res.send(tokens);
});

router.post("/refresh", async (req, res) => {
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
  };

  const tokens = generateTokens(payload);

  refreshToken.token = tokens.refresh_token;
  await refreshToken.save();

  res.send(tokens);
});

router.put("/logout/:id", async (req, res) => {
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
