const express = require('express');
const { getAnalytics, changeRole, getUsers, deleteUser, deleteAllTransactions } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/analytics', isAdmin, getAnalytics);
router.patch('/role', isAdmin, changeRole);
router.get('/', isAdmin, getUsers);
router.delete('/:id', isAdmin, deleteUser);
router.delete("/transactions", isAdmin, deleteAllTransactions);

module.exports = router;
