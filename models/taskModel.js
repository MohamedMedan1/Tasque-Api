const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task must have a title!'],
    maxlength: [30, 'Task title can be at most 30 characters'],
    minlength:[4,'Task title can be at least 4 characters']
  },
  description: {
    type: String,
    maxlength: [120, 'Task description can be at most 120 characters'],    
  },
  isCompleted: {
    type: Boolean,
    default:false
  },
  createdAt: {
    type: Date,
    default:Date.now
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message:'Priority level can be low,medium (default) and high only'
    },
    default:'medium',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required:[true,'Task must have a user ref!'],
  }
});

// Pre Document Middleware to lower case of some fields value
taskSchema.pre('save',function(next){
  this.title = this.title.toLowerCase();
  this.description = this.description.toLowerCase();
  next();
})


taskSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select:'name email'});
  next();
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;