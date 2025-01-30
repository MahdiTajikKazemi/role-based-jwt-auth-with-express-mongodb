require("express-async-errors");
const express = require("express");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const app = express();
const cookieParser = require("cookie-parser");

const users = require("./routes/users");
const products = require("./routes/products");
const auth = require("./routes/auth");

require("dotenv").config();
require("./db")();

app.use(express.json());
app.use(express.json());
app.use(cookieParser());

app.use("/users", users);
app.use("/products", products);
app.use("/auth", auth);

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`Listening on port ${port}...`));
