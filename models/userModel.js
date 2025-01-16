const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  balance: { type: DataTypes.FLOAT, defaultValue: 0.0, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
});

module.exports = User;
