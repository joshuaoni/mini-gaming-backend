const express = require("express");
const { playGame } = require("../controllers/gameController");
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post("/play", authenticate, playGame);

module.exports = router;