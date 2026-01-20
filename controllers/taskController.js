const Task = require('../models/taskModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.makeItCompleted = (req, res, next) => {
  req.body = { isCompleted: true };
  next();
};

exports.getAllTasks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Task.find(), req.query, req.user._id)
    .filter()
    .sort()
    .select()
    .paginate();
  
  const tasks = await features.query;
  
  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks
  })
});

exports.getTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
    
  const task = await Task.findById(id);
  
  if (!task) return next(new AppError('There is no tack with that ID', 404));

  if (!task.user.equals(req.user._id)) return next(new AppError('You only can see your tasks', 403));

  res.status(200).json({
    status: 'success',
    data: task
  })
});

exports.createTask = catchAsync(async (req, res, next) => {
  const taskData = { ...req.body, user: req.user._id };

  const newTask = await Task.create(taskData);

  res.status(201).json({
    status: 'success',
    data: newTask,
  })
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updatedTask = await Task.findOneAndUpdate({ _id: id, user: req.user._id }, req.body,{
    new: true,
    runValidators: true
  })

  if (!updatedTask) return next(new AppError('There is no task with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: updatedTask
  })
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedTask = await Task.findOneAndDelete({_id:id,user:req.user._id});
  
  if (!deletedTask) return next(new AppError('There is no task with that ID', 404));

  res.status(204).json({
    status: 'success',
    data: null
  })

});

exports.completeTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const userId  = req.user._id;

  const task = await Task.findOneAndUpdate({_id:taskId,user:userId}, req.body, {
    new: true,
    runValidators: true,
  });

  if (!task) {
    return next(new AppError('There is no task with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: task,
  })
});

exports.getTasksStatsPro = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const tasksStats = await Task.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ['$isCompleted', false] }, 1, 0] }
        },
      }
    },
    {
      $project: {
        totalTasks: 1,
        completedTasks: 1,
        pendingTasks: 1,
        completion: {
          $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100]
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: tasksStats
  })
});

