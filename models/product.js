const mongoose = require("mongoose");
const Joi = require("joi");

const productSchema = new mongoose.Schema({
  label: {
    type: String,
    minlength: 5,
    maxlength: 255,
    required: true,
  },

  quantityInStock: {
    type: Number,
    default: 0,
  },

  unitPrice: {
    type: Number,
    default: 0,
  },
});

const Product = mongoose.model("Product", productSchema);

function validateProduct(product) {
  const schema = Joi.object({
    label: Joi.string().min(5).max(255).required(),
    quantityInStock: Joi.number(),
    unitPrice: Joi.number(),
  });

  return schema.validate(product);
}

exports.Product = Product;
exports.validate = validateProduct;
