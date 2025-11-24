const express = require('express');
const { authRequired } = require('../middleware/auth');
const { transactions } = require('../data/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const userTransactions = transactions.filter((t) => t.userId === req.user.id);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedTransactions = userTransactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(startIndex, endIndex);
  
  res.json({
    transactions: paginatedTransactions,
    pagination: {
      page,
      limit,
      total: userTransactions.length,
      pages: Math.ceil(userTransactions.length / limit)
    }
  });
});

module.exports = router;
