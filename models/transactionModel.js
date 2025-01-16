const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define("Transaction", {
  type: { type: DataTypes.ENUM("deposit", "withdrawal", "game"), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = Transaction;