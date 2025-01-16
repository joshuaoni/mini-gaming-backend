const express = require("express");
const {
  deposit,
  withdraw,
  getTransactions,
  getBalance,
} = require("../controllers/walletController");
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post("/deposit", authenticate, deposit);
router.post("/withdraw", authenticate, withdraw);
router.get("/transactions", authenticate, getTransactions);
router.get("/balance", authenticate, getBalance);

module.exports = router;
