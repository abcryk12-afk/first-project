const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, stakes, transactions } = require('../data/store');

const router = express.Router();

const APR = 0.12;
const MIN_STAKE = 10;

router.post('/', authRequired, (req, res) => {
  const { amount, duration } = req.body;
  
  if (!amount || amount < MIN_STAKE) {
    return res.status(400).json({ error: `Minimum stake amount is ${MIN_STAKE} tokens` });
  }
  
  if (!duration || ![30, 60, 90].includes(parseInt(duration))) {
    return res.status(400).json({ error: 'Duration must be 30, 60, or 90 days' });
  }
  
  const wallet = wallets.find((w) => w.userId === req.user.id);
  
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  const stake = {
    id: stakes.length + 1,
    userId: req.user.id,
    amount: parseFloat(amount),
    duration: parseInt(duration),
    APR,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  
  stakes.push(stake);
  
  wallet.balance -= parseFloat(amount);
  wallet.stakedBalance += parseFloat(amount);
  wallet.updatedAt = new Date().toISOString();
  
  const transaction = {
    id: transactions.length + 1,
    userId: req.user.id,
    type: 'stake',
    amount: parseFloat(amount),
    status: 'completed',
    createdAt: new Date().toISOString(),
    stakeId: stake.id
  };
  
  transactions.push(transaction);
  
  res.status(201).json({
    message: 'Stake created successfully',
    stake: {
      id: stake.id,
      amount: stake.amount,
      duration: stake.duration,
      APR: stake.APR,
      status: stake.status,
      createdAt: stake.createdAt
    }
  });
});

module.exports = router;
