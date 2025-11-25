const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const depositRoutes = require('./routes/depositRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import services
const depositListener = require('./services/depositListener');
const confirmationHandler = require('./services/confirmationHandler');
const sweepEngine = require('./services/sweepEngine');

// Import database
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for Render
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 NexChain USDT Deposit System API',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      wallet: '/api/wallet/balance',
      stakes: '/api/stake',
      admin: '/api/admin',
      frontend: '/stake'
    }
  });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NexChain USDT Deposit System'
  });
});

// Stake API endpoints for frontend
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const db = require('./config/database');
    
    // Get user balance
    const userResult = await db.execute(
      'SELECT balance, total_staked FROM users WHERE id = ?', 
      [userId]
    );
    
    const user = userResult[0][0] || { balance: 0, total_staked: 0 };
    
    // Calculate daily rewards
    const stakesResult = await db.execute(
      'SELECT amount, apy FROM stakes WHERE user_id = ? AND status = "active"', 
      [userId]
    );
    
    const stakes = stakesResult[0];
    const dailyRewards = stakes.reduce((total, stake) => {
      return total + (stake.amount * stake.apy / 100 / 365);
    }, 0);
    
    res.json({
      balance: user.balance || 0,
      stakedBalance: user.total_staked || 0,
      dailyRewards: dailyRewards
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stake', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const db = require('./config/database');
    
    const result = await db.execute(
      'SELECT * FROM stakes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    const stakes = result[0].map(stake => ({
      id: stake.id,
      amount: stake.amount,
      period: stake.period,
      apy: stake.apy,
      startDate: stake.start_date,
      endDate: stake.end_date,
      status: stake.status,
      rewardsEarned: stake.rewards_earned || 0,
      dailyRewards: stake.daily_rewards || (stake.amount * stake.apy / 100 / 365)
    }));
    
    res.json(stakes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stake', async (req, res) => {
  try {
    const { amount, period, apy, userId = 1 } = req.body;
    
    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum staking amount is 10 USDT' });
    }
    
    const db = require('./config/database');
    
    // Check user balance
    const userResult = await db.execute(
      'SELECT balance FROM users WHERE id = ?', 
      [userId]
    );
    
    const userBalance = userResult[0][0]?.balance || 0;
    
    if (amount > userBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + period);
    
    // Calculate daily rewards
    const dailyRewards = amount * apy / 100 / 365;
    
    // Create stake
    const stakeResult = await db.execute(
      'INSERT INTO stakes (user_id, amount, period, apy, start_date, end_date, daily_rewards) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, amount, period, apy, startDate.toISOString(), endDate.toISOString(), dailyRewards]
    );
    
    // Update user balance and staked amount
    await db.execute(
      'UPDATE users SET balance = balance - ?, total_staked = total_staked + ? WHERE id = ?',
      [amount, amount, userId]
    );
    
    const newStake = {
      id: stakeResult[0].insertId,
      amount: amount,
      period: period,
      apy: apy,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      rewardsEarned: 0,
      dailyRewards: dailyRewards
    };
    
    res.json(newStake);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start services
async function startServices() {
  try {
    // Test database connection
    await db.getConnection();
    console.log('✅ Database connected successfully');

    // Temporarily disable BSC services to fix connection loop
    console.log('⚠️ BSC Services temporarily disabled for testing');
    
    // Start deposit listener (DISABLED)
    // depositListener.start();
    // console.log('✅ Deposit listener started');

    // Start confirmation handler (DISABLED)
    // cron.schedule('*/10 * * * * *', confirmationHandler.checkConfirmations);
    // console.log('✅ Confirmation handler scheduled');

    // Start sweep engine (DISABLED)
    // cron.schedule('*/30 * * * * *', sweepEngine.processSweeps);
    // console.log('✅ Sweep engine scheduled');

    console.log('🚀 Core services started successfully (BSC services disabled)');
  } catch (error) {
    console.error('❌ Error starting services:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NexChain Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  
  // Only start services if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    startServices();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  depositListener.stop();
  process.exit(0);
});

// Serve static files
app.use(express.static('public'));

// Frontend routes (API routes first)
app.get('/stake', (req, res) => {
  res.sendFile(__dirname + '/public/stake.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/deposit', (req, res) => {
  res.sendFile(__dirname + '/public/deposit.html');
});

app.get('/withdraw', (req, res) => {
  res.sendFile(__dirname + '/public/withdraw.html');
});

app.get('/transactions', (req, res) => {
  res.sendFile(__dirname + '/public/transactions.html');
});

module.exports = app;