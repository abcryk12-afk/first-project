const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const stakeRoutes = require('./routes/stake');
const transactionRoutes = require('./routes/transactions');
const withdrawRoutes = require('./routes/withdraw');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NovaStake backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/stake', stakeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdraw', withdrawRoutes);

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
