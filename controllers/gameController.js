const crypto = require("crypto");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const { invalidateCache } = require("../utils/utils");

const playGame = async (req, res) => {
  const { amount, coinFace, clientSeed } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (+user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    const serverSeed = crypto.randomBytes(16).toString("hex");
    const combinedSeed = `${serverSeed}:${clientSeed || "default-client-seed"}`;
    const hash = crypto.createHash("sha256").update(combinedSeed).digest("hex");
    const randomOutcome = parseInt(hash.slice(0, 8), 16) / 0xffffffff;

    const outcome = randomOutcome < 0.5 ? "head" : "tail";
    const reward = outcome === coinFace ? amount * 2 : 0;

    user.balance = outcome === coinFace
      ? Number(user.balance) + reward
      : Number(user.balance) - amount;
    await user.save();
    await Transaction.create({
      userId,
      amount: outcome === coinFace ? reward : -amount,
      type: "game",
    });

    await invalidateCache(userId);

    res.json({
      outcome,
      balance: user.balance,
      serverSeed,
      clientSeed: clientSeed || "default-client-seed",
      combinedSeed,
      hash
    });
  } catch (err) {
    res.status(400).json({ error: "Error processing game" });
  }
};

module.exports = { playGame };