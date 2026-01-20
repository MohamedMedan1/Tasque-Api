const express = require('express');
const { getAllUsers, deleteMe, updateMe, deActivateUser,getActiveUsers, setIsActiveQuery, getActiveRatio, getUsersPerformance } = require('../controllers/userController');
const { signup, login, protect, forgotPassword, resetPassword, updatePassword, deleteUser, restrictTo,changeUserRole, logout } = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:resetToken').patch(resetPassword);

// Apply Protect middleware to check that user always login and his/her data in req.user
router.use(protect);

router.route('/logout').get(logout);

router.route('/deleteMe')
  .patch(deActivateUser, deleteMe);

router.route('/updateMe')
  .patch(updateMe);

router.route('/updatePassword')
  .patch(updatePassword);

// Apply Authorization middleware to restrict some operations to only admin's
router.use(restrictTo('admin'));

router.route('/performance')
  .get(getUsersPerformance);

router.route('/activeRatio')
  .get(getActiveRatio);

router.route('/active')
  .get(setIsActiveQuery,getActiveUsers);

router.route('/changeUserRole/:userId')
  .patch(changeUserRole);

router.route('/')
  .get(getAllUsers);

router.route('/:id')
  .delete(deleteUser);

module.exports = router;
