const express = require('express');
const { authRequired } = require('../middleware/auth');
const { transactions } = require('../data/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const userTransactions = transactions.filter((t) => t.userId === req.user.id);
  
  res.json({
    transactions: userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

module.exports = router;
