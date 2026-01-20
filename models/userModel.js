const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name!'],
    minlength: [3, 'User name can be at least 3 characters'],
    maxlength: [20, 'User name can be at most 20 characters'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'User must have an email!'],
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  password: {
    type: String,
    required: [true, 'User must have a password!'],
    minlength: [8, 'User password can be at least 8 characters'],
    maxlength: [16, 'User password can be at most 16 characters'],
    select: false,
    // validate:[validator.isStrongPassword,'Please provide a strong password!']
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User must confirm his/her password'],
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: 'password should be equal to password confirm',
    }
  },
  passwordChangedAt: Date,
  isActive: {
    type: Boolean,
    default:true,
  },
  resetToken: String,
  resetTokenExpires: Date,
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message:'User role can be only user or admin'
    },
    default:'user',
  }
});

// Check if user candidate password is same of the original One in DB 
userSchema.methods.correctPassword = async function(candidatePassword,userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

// Check if user password was changed after log in or not
userSchema.methods.changedPasswordAfter = function (jwtCreatedTime) {
  if (!this.passwordChangedAt) return false;

  const passwordChangedTimestamp = parseInt(new Date(this.passwordChangedAt).getTime() / 1000, 10);
  return jwtCreatedTime < passwordChangedTimestamp;
}

// Instance method to generate token and send it to user via controllers by nodemailer and save it into Document to compare it with user one later
userSchema.methods.generateResetToken = async function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetTokenExpires = new Date(Date.now() + (10 * 60 * 1000)); 

  return token;
}

// Pre Document Middleware to set time of password change before save doc
userSchema.pre('save', function (next) {
  if (this.isNew || !this.isModified('password')) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

// Pre Document Middleware to encypt password to protect the user info 
userSchema.pre('save', async function (next) {
  // Check if user password is changed or not and if user account is new doc or not 
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
})

// Pre Query Middleware to un select (__v) field
userSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
}) 

const User = mongoose.model('User', userSchema);

module.exports = User;