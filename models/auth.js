const Joi = require("joi");

module.exports = function (user) {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().min(8).max(255).required(),
  });

  return schema.validate(user);
};
