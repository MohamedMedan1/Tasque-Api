const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit'); 
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

dotenv.config({ path: './config.env' });
const taskRouter = require('./routes/taskRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Prevent user to set any http headers
app.use(helmet());

// Rate  Limiting for Requests to Prevent DOS Attacks and Brute Force Attack
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after 1 hour'
});
app.use('/api', limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10kb' }));

// Prevent NoSQL Query Injection Attacks By Sanitize User Input
app.use(mongoSanitize());

// Prevent Cross Site Scripting Attacks (XSS Attacks)
app.use(xss());

// Prevent paramter pollution
app.use(hpp({
  whitelist: ['title','isCompleted', 'createdAt', 'priority']
}));


// Routing Middleware
app.use('/api/v1/tasks',taskRouter);
app.use('/api/v1/users', userRouter);

app.use('*', (req, _, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
})

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;