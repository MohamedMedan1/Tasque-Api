const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const createEmail = require('../utils/email');
const generateJWTAndSendRes = require('../utils/generateJWT');

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not authorized to execute this action', 401));
    }
    next();
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  
  const newUser = await User.create({ name, email, password, passwordConfirm });

  generateJWTAndSendRes(res, newUser);

});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide your email and password to log in', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  generateJWTAndSendRes(res, user)
});

// Middleware to check if you logged in or not
exports.protect = catchAsync(async (req, res, next) => {
  let token = '';
  if (req.headers && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Please go log in and try again', 401));
  }

  // 2) Check if JWT is Valid
  const { id, iat } = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  // 3) Check if user is still exits
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('There is no user with that ID', 404));
  }

  // 4) check if user password is not changed after login
  if (user.changedPasswordAfter(iat)) {
    return next(new AppError('You have to log in again due to password changed', 401));
  }

  // Add user data in his/her req to be able to use data in any controller
  req.user = user;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new AppError('Please provide your email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user with that ID', 404));
  }

  const resetToken = await user.generateResetToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  try {
    const options = {
      to: user.email,
      subject: 'Reset your password at Tasque',
      message: resetUrl
    }
    await createEmail(options);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Something went wrong while trying send email', 400));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError('Please provide new password and password confirm', 400));
  }
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError(`Reset token is expired try again with ${req.protocol}://${req.get('host')}/api/v1/users/forgotPassword`, 404));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  generateJWTAndSendRes(res, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new AppError('Please provide your old password and the new one and its confirm', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('There is no user with that ID', 404));
  }

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your old password is incorrect try again with correct one', 401));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  
  await user.save();

  generateJWTAndSendRes(res, user);
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id:userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return next(new AppError('There is no user with that ID', 404));
  }

  await Task.deleteMany({ user: userId });

  res.status(204).json({
    status: 'success',
    data:null,
  })
});

exports.changeUserRole = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) {
    return next(new AppError('Please provide the new role of user!', 400));
  }

  const user = await User.findByIdAndUpdate(userId, { role }, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('There is no user with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: user
  });
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};
