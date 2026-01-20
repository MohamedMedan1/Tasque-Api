const express = require('express');
const { getAllTasks, createTask, getTask, updateTask, deleteTask,getTasksStatsPro, makeItCompleted, completeTask } = require('../controllers/taskController');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.use(protect);

router.route('/completeTask/:taskId')
  .patch(makeItCompleted,completeTask);

router.route('/stats/pro')
  .get(getTasksStatsPro);
  
router.route('/')
  .get(getAllTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .patch(updateTask)
  .delete(deleteTask);

module.exports = router;


