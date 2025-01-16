const express = require('express');
const { registerUser, loginUser, validate } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/validate', validate);

module.exports = router;