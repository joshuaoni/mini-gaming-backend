const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("../models/userModel");

const getAnalytics = async (req, res) => {
  try {
    const totalTransactions = await sequelize.query(
      `SELECT COUNT(*) AS count FROM "Transactions"`,
      { type: QueryTypes.SELECT }
    );

    const transactionsInLast24h = await sequelize.query(
      `SELECT COUNT(*) AS count FROM "Transactions" WHERE "createdAt" >= NOW() - INTERVAL '24 HOURS'`,
      { type: QueryTypes.SELECT }
    );

    const transactionsByType = await sequelize.query(
      `SELECT type, COUNT(*) AS count FROM "Transactions" GROUP BY type`,
      { type: QueryTypes.SELECT }
    );

    const transactionsByTypeFormatted = transactionsByType.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count, 10);
      return acc;
    }, { deposit: 0, withdrawal: 0, game: 0 });

    const topDepositors = await sequelize.query(
      `
      SELECT u.username, SUM(t.amount) AS totalWon
      FROM "Users" u
      JOIN "Transactions" t ON u.id = t."userId"
      WHERE t.type = 'deposit'
      GROUP BY u.id, u.username
      ORDER BY totalWon DESC
      LIMIT 3
      `,
      { type: QueryTypes.SELECT }
    );

    const totalDeposits = await sequelize.query(
      `SELECT SUM(amount) AS total FROM "Transactions" WHERE type = 'deposit'`,
      { type: QueryTypes.SELECT }
    );

    const totalWithdrawals = await sequelize.query(
      `SELECT SUM(amount) AS total FROM "Transactions" WHERE type = 'withdrawal'`,
      { type: QueryTypes.SELECT }
    );

    const totalGamesPlayed = await sequelize.query(
      `SELECT COUNT(*) AS count FROM "Transactions" WHERE type = 'game'`,
      { type: QueryTypes.SELECT }
    );

    const averageTransactionAmount = await sequelize.query(
      `SELECT AVG(amount) AS average FROM "Transactions"`,
      { type: QueryTypes.SELECT }
    );

    const analytics = {
      totalTransactions: parseInt(totalTransactions[0].count, 10),
      transactionsInLast24h: parseInt(transactionsInLast24h[0].count, 10),
      transactionsByType: transactionsByTypeFormatted,
      topDepositors: topDepositors.map((winner) => ({
        username: winner.username,
        totalWon: parseFloat(winner.totalwon),
      })),
      totalDeposits: parseFloat(totalDeposits[0].total || 0),
      totalWithdrawals: parseFloat(totalWithdrawals[0].total || 0),
      totalGamesPlayed: parseInt(totalGamesPlayed[0].count, 10),
      averageTransactionAmount: parseFloat((averageTransactionAmount[0].average || 0).toFixed(2)),
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const changeRole = async (req, res) => {
  const { isAdmin, userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user || typeof isAdmin !== "boolean") {
      return res.status(400).json({ error: "Invalid request data" });
    }
    user.isAdmin = isAdmin;
    await user.save();
    res.status(201).json({ message: "Role successfully changed" });
  } catch (err) {
    console.error("Error changing role:", err.message);
    res.status(500).json({ error: "Error changing role" });
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users." });
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting user." });
  }
};

const deleteAllTransactions = async (req, res) => {
  try {
    await Transaction.truncate();
    res.status(200).json({ message: "Transactions deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting transactions." });
  }
};

module.exports = { getAnalytics, changeRole, getUsers, deleteUser, deleteAllTransactions };
