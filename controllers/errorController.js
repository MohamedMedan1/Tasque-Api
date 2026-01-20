const AppError = require("../utils/appError");

const handleCastError = () => {
  return new AppError("Please provide a valid ID", 400);
}

const handleDuplicateError = (err) => {
  const duplicatedFields = Object.keys(err.keyPattern);
  const messages = duplicatedFields.map(el => `Your ${el} value is already exist ,try again with another one`).join(',');
  return new AppError(messages, 400);
}

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(msg => msg).join(' , ');
  return new AppError(messages,400);
}

const handleJsonWebTokenError = () => {
  return new AppError('Invalid Json Web Token, please log in', 401);
}

const handleJsonWebTokenExpiredError = () => {
  return new AppError('Your token has been expired, please log in again', 401);
}

const handleDevelopmentResponse = (res, err) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  res.status(statusCode).json({
    status,
    message: err.message,
    stack:err.stack,
  })
}

const handleProductionResponse = (res, err) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status:err.status,
      message: err.message,
    })
  }
  res.status(500).json({
    status: 'error',
    message:'Something went very wrong!'
  })  
}

const globalErrorHandler = (err, req, res, next) => {

  if (err.name === 'CastError') err = handleCastError();
  if (err.code === 11000) err = handleDuplicateError(err);
  if (err.name === 'ValidationError') err = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') err = handleJsonWebTokenError();
  if (err.name === 'TokenExpiredError') err = handleJsonWebTokenExpiredError();

  // Check Our Environment If Its Dev or Pro
  if (process.env.NODE_ENV === 'development') handleDevelopmentResponse(res, err)
  
  else if (process.env.NODE_ENV === 'production') handleProductionResponse(res, err);  
};

module.exports = globalErrorHandler;