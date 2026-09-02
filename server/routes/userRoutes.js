const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllUsers, createUser, deleteUser } = require('../controllers/userController');

router.use(verifyToken);
router.use(requireRole(['ADMIN']));

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .delete(deleteUser);

module.exports = router;
