const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, stakes, transactions } = require('../data/store');

const router = express.Router();

const APR = 0.12; // 12% APR

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

  if (numericAmount > wallet.balance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  wallet.balance -= numericAmount;
  wallet.stakedBalance += numericAmount;

  const id = stakes.length + 1;
  const now = new Date().toISOString();
  const stake = {
    id,
    userId,
    amount: numericAmount,
    apr: APR * 100, // store as percent
    startDate: now,
    lastRewardAt: now,
    status: 'ACTIVE',
  };
  stakes.push(stake);

  const txId = transactions.length + 1;
  transactions.push({
    id: txId,
    userId,
    type: 'STAKE',
    amount: numericAmount,
    createdAt: now,
    status: 'COMPLETED',
  });

  wallet.updatedAt = now;

  res.status(201).json({
    wallet: {
      balance: wallet.balance,
      stakedBalance: wallet.stakedBalance,
      rewardBalance: wallet.rewardBalance,
    },
    stake,
  });
});

router.get('/', authRequired, (req, res) => {
  const userId = req.user.id;
  const userStakes = stakes.filter((s) => s.userId === userId);
  res.json(userStakes);
});

module.exports = router;
