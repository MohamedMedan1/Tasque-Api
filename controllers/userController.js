const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const filterBodyFields = require("../utils/filterBody");

exports.setIsActiveQuery = (req, res, next) => {
  req.query.isActive = true;
  next();
};

exports.deActivateUser = (req, _, next) => {
  req.body = { isActive: false };
  next();
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("name email");
  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  let notes = [];

  if (req.body.password || req.body.passwordConfirm) {
    notes = [
      ...notes,
      `Password can't be updated here. Use ${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/updatePassword`,
    ];
  }

  ["isActive", "role"].forEach((f) => {
    if (req.body[f] !== undefined) {
      notes = [...notes, `Field "${f}" cannot be updated via this route.`];
    }
  });

  const updateFields = filterBodyFields(req.body);

  const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("There is no account with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    notes: notes.length ? notes : undefined,
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const curUser = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: curUser,
    },
  });
});

exports.getActiveUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ isActive: req.query.isActive });

  if (users.length === 0) {
    return next(new AppError("There is no active users yet", 404));
  }

  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.getActiveRatio = catchAsync(async (req, res, next) => {
  const activeRatio = await User.aggregate([
    {
      $group: {
        _id: null,
        activatedUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        deActivatedUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        activatedUsers: 1,
        deActivatedUsers: 1,
        percentOfActivatedUsers: {
          $multiply: [
            {
              $divide: [
                "$activatedUsers",
                {
                  $cond: [
                    { $ne: ["$deActivatedUsers", 0] },
                    "$deActivatedUsers",
                    1,
                  ],
                },
              ],
            },
            100,
          ],
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: activeRatio,
  });
});

exports.getUsersPerformance = catchAsync(async (req, res, next) => {
  const usersPerformance = await User.aggregate([
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "user",
        as: "userTasks",
      },
    },
    {
      $project: {
        name: 1,
        totalTasks: { $size: "$userTasks" },
        completedTasks: {
          $size: {
            $filter: {
              input: "$userTasks",
              as: "task",
              cond: { $eq: ["$$task.isCompleted", true] },
            },
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: usersPerformance,
  });
});
