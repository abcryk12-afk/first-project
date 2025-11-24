const express = require('express');
const { authRequired } = require('../middleware/auth');
const { transactions } = require('../data/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, type } = req.query;

  let userTxs = transactions.filter((t) => t.userId === userId);
  if (type) {
    userTxs = userTxs.filter((t) => t.type === String(type).toUpperCase());
  }

  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const start = (p - 1) * l;
  const end = start + l;

  const paged = userTxs.slice(start, end);

  res.json({
    data: paged,
    pagination: {
      page: p,
      limit: l,
      total: userTxs.length,
    },
  });
});

module.exports = router;
