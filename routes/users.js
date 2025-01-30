const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const { User, validate } = require("../models/user");
router = express.Router();

router.get("/", [auth, isAdmin], async (req, res) => {
  const users = await User.find();

  res.send(users);
});

router.get("/:id", [auth, isAdmin], async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found.");

  res.send(user);
});

router.post("/", [auth, isAdmin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["username", "email", "password", "role"]));

  user.password = await bcrypt.hash(user.password, 10);

  await user.save();

  res.status(201).send(_.pick(user, ["username", "email", "_id"]));
});

router.put("/:id", [auth, isAdmin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found.");

  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  user.username = username;
  user.email = email;
  user.password = hashedPassword;

  await user.save();

  res.send(_.pick(user, ["username", "email", "_id"]));
});

router.delete("/:id", [auth, isAdmin], async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).send("User not found.");

  res.send(user);
});

module.exports = router;
