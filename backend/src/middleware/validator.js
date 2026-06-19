const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const validSchema = Object.keys(schema).reduce((acc, key) => {
    acc[key] = Joi.compile(schema[key]);
    return acc;
  }, {});

  const object = Object.keys(validSchema).reduce((acc, key) => {
    acc[key] = req[key];
    return acc;
  }, {});

  const { value, error } = Joi.object(validSchema).validate(object, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    const err = new Error(errorMessage);
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
