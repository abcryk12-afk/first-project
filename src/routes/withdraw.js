const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, transactions } = require('../data/store');

const router = express.Router();

router.post('/', authRequired, (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  const wallet = wallets.find((w) => w.userId === userId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  if (numericAmount > wallet.rewardBalance) {
    return res.status(400).json({ error: 'Insufficient reward balance' });
  }

  const now = new Date().toISOString();

  wallet.rewardBalance -= numericAmount;
  wallet.balance += numericAmount;
  wallet.updatedAt = now;

  const txId = transactions.length + 1;
  transactions.push({
    id: txId,
    userId,
    type: 'WITHDRAW',
    amount: numericAmount,
    createdAt: now,
    status: 'COMPLETED',
  });

  res.json({
    wallet: {
      balance: wallet.balance,
      stakedBalance: wallet.stakedBalance,
      rewardBalance: wallet.rewardBalance,
      updatedAt: wallet.updatedAt,
    },
    transactionId: txId,
  });
});

module.exports = router;
