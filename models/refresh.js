const mongoose = require("mongoose");
const Joi = require("joi");

const refreshSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  token: {
    type: String,
    maxlength: 1024,
  },
});

const Refresh = mongoose.model("Refresh", refreshSchema);

function validateRefreshToken(refresh) {
  const schema = Joi.object({
    userId: Joi.objectId().required(),
    token: Joi.string().required(),
  });

  return schema.validate(refresh);
}

exports.Refresh = Refresh;
exports.validateRefreshToken = validateRefreshToken;
