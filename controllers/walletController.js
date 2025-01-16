const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const { invalidateCache } = require("../utils/utils");
const client = require("../config/redisClient");

const deposit = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.balance = +user.balance;
    user.balance += amount;
    await user.save();
    await Transaction.create({ userId, amount, type: "deposit" });
    await invalidateCache(userId);
    res.json({ message: "Deposit successful", balance: user.balance });
  } catch (err) {
    res.status(400).json({ error: "Error processing deposit" });
  }
};

const withdraw = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
    user.balance = +user.balance;
    user.balance -= amount;
    await user.save();
    await Transaction.create({ userId, amount, type: "withdrawal" });
    await invalidateCache(userId);
    res.json({ message: "Withdrawal successful", balance: user.balance });
  } catch (err) {
    res.status(400).json({ error: "Error processing withdrawal" });
  }
};

const getBalance = async (req, res) => {
  const userId = req.user.id;

  try {
    const cachedBalance = await new Promise((resolve, reject) => {
      client.get(`balance:${userId}`, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (cachedBalance) {
      console.log('Cache hit for balance');
      return res.status(200).json({ balance: parseFloat(cachedBalance) }); // Convert cached string back to number
    }

    console.log('Cache miss for balance');

    const user = await User.findByPk(userId, { attributes: ['balance'] });
    if (user) {
      await client.set(`balance:${userId}`, String(user.balance), 'EX', 3600);
      return res.status(200).json({ balance: user.balance });
    }

    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(400).json({ error: 'Error fetching balance' });
  }
};

const getTransactions = async (req, res) => {
  const userId = req.user.id;
  const { limit, offset } = req.query;

  try {
    const cacheKey = `transactions:${userId}:limit:${limit}:offset:${offset}`;

    const cachedTransactions = await new Promise((resolve, reject) => {
      client.get(cacheKey, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (cachedTransactions) {
      console.log('Cache hit for transactions');
      return res.status(200).json({ transactions: JSON.parse(cachedTransactions) });
    }

    console.log('Cache miss for transactions');

    const transactions = await Transaction.findAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    await client.set(cacheKey, JSON.stringify(transactions), 'EX', 3600);
    res.status(200).json({ transactions });
  } catch (err) {
    res.status(400).json({ error: 'Error fetching transactions' });
  }
};

module.exports = { deposit, withdraw, getTransactions, getBalance };