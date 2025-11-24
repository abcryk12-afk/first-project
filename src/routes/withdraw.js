const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, transactions } = require('../data/store');

const router = express.Router();

const MIN_WITHDRAW = 5;

router.post('/', authRequired, (req, res) => {
  const { amount, address } = req.body;
  
  if (!amount || amount < MIN_WITHDRAW) {
    return res.status(400).json({ error: `Minimum withdrawal amount is ${MIN_WITHDRAW} tokens` });
  }
  
  if (!address) {
    return res.status(400).json({ error: 'Withdrawal address is required' });
  }
  
  const wallet = wallets.find((w) => w.userId === req.user.id);
  
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  wallet.balance -= parseFloat(amount);
  wallet.updatedAt = new Date().toISOString();
  
  const transaction = {
    id: transactions.length + 1,
    userId: req.user.id,
    type: 'withdraw',
    amount: parseFloat(amount),
    address,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  transactions.push(transaction);
  
  res.status(201).json({
    message: 'Withdrawal request submitted successfully',
    transaction: {
      id: transaction.id,
      amount: transaction.amount,
      address: transaction.address,
      status: transaction.status,
      createdAt: transaction.createdAt
    }
  });
});

module.exports = router;
