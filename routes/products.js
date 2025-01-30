const express = require("express");
const _ = require("lodash");
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const { Product, validate } = require("../models/product");
router = express.Router();

router.get("/", auth, async (req, res) => {
  const products = await Product.find().sort("quantityInStock");

  res.send(products);
});

router.get("/:id", auth, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found.");

  res.send(product);
});

router.post("/", [auth, isAdmin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const product = new Product(
    _.pick(req.body, ["label", "quantityInStock", "unitPrice"])
  );

  await product.save();

  res.status(201).send(product);
});

router.put("/:id", [auth, isAdmin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { label, quantityInStock, unitPrice } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      label,
      quantityInStock,
      unitPrice,
    },
    { new: true }
  );

  res.send(product);
});

router.delete("/:id", [auth, isAdmin], async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).send("Product not found.");

  res.send(product);
});

module.exports = router;
