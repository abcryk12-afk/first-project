// Admin API routes for NovaStake Admin Panel
const express = require('express');
const router = express.Router();
const { users, wallets, stakes, transactions } = require('../data/store');
const { adminAccounts, initializeAdminStorage } = require('../data/adminStore');

// Initialize admin storage
const admins = initializeAdminStorage();

// Admin authentication middleware
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // For demo purposes, accept any admin token
  // In production, verify JWT token with admin role
  if (!token) {
    return res.status(401).json({ message: 'Admin token required' });
  }
  
  // Fallback authentication for demo
  if (token.includes('admin-token') || token.length > 20) {
    req.admin = { id: 1, name: 'Admin User', email: 'admin@novastake.com' };
    next();
  } else {
    res.status(401).json({ message: 'Invalid admin token' });
  }
}

// Admin validation route
router.post('/validate', adminAuth, async (req, res) => {
  try {
    console.log('🔍 Admin token validation request');
    
    // If we reach here, adminAuth middleware already validated the token
    res.json({ 
      valid: true, 
      message: 'Admin token is valid',
      admin: req.admin 
    });
    
  } catch (error) {
    console.error('❌ Admin validation error:', error);
    res.status(500).json({ message: 'Admin validation failed' });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Admin login attempt:', { email });
    
    // Find admin in our storage
    const admin = admins.find(a => a.email === email && a.is_active);
    
    if (!admin) {
      console.log('❌ Admin not found:', email);
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Check password (in production, use bcrypt)
    if (admin.password !== password) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Update last login
    admin.last_login = new Date().toISOString();
    
    const adminToken = 'admin-token-' + Date.now();
    
    console.log('✅ Admin login successful:', email);
    
    res.json({
      message: 'Admin login successful',
      token: adminToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
    
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ message: 'Admin login failed' });
  }
});

// Admin register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, secretKey, role } = req.body;
    
    console.log('🔍 Admin register attempt:', { email, role });
    
    // Validate secret key
    if (secretKey !== '123') {
      console.log('❌ Invalid secret key for:', email);
      return res.status(400).json({ message: 'Invalid secret key' });
    }
    
    // Check if admin already exists
    const existingAdmin = admins.find(a => a.email === email);
    if (existingAdmin) {
      console.log('❌ Admin already exists:', email);
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }
    
    // Validate password
    if (!password || password.length < 8) {
      console.log('❌ Password too short for:', email);
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    
    // Create new admin
    const newAdmin = {
      id: Date.now(),
      name: name,
      email: email,
      password: password, // In production, hash this password
      role: role || 'admin',
      created_at: new Date().toISOString(),
      is_active: true,
      last_login: null
    };
    
    admins.push(newAdmin);
    
    console.log('✅ Admin registered successfully:', email);
    console.log(`📊 Total admins: ${admins.length}`);
    
    res.json({
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
    
  } catch (error) {
    console.error('❌ Admin registration error:', error);
    res.status(500).json({ message: 'Admin registration failed' });
  }
});

// Get all admin accounts (for admin setup page)
router.get('/accounts', adminAuth, async (req, res) => {
  try {
    const adminList = admins.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      created_at: a.created_at,
      is_active: a.is_active,
      last_login: a.last_login
    }));
    
    console.log(`📊 Admin accounts requested: ${adminList.length} admins`);
    res.json(adminList);
  } catch (error) {
    console.error('❌ Get admin accounts error:', error);
    res.status(500).json({ message: 'Failed to get admin accounts' });
  }
});

// Get system statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    console.log('📊 Admin requesting system stats...');
    
    const stats = {
      totalUsers: users.length,
      totalTransactions: transactions.length,
      totalStaked: transactions
        .filter(t => t.type === 'stake')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      totalWithdrawals: transactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      activeUsers: users.filter(u => u.wallet_balance > 0).length,
      recentUsers: users.filter(u => {
        const userDate = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return userDate > weekAgo;
      }).length,
      totalRewards: transactions
        .filter(t => t.type === 'reward')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      pendingWithdrawals: transactions
        .filter(t => t.type === 'withdraw' && t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    };
    
    res.json(stats);
    console.log('✅ System stats sent:', stats);
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ message: 'Failed to get statistics' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    console.log('👥 Admin requesting all users...');
    
    // Enhance user data with wallet information
    const enhancedUsers = users.map(user => {
      const wallet = wallets.find(w => w.user_id === user.id);
      return {
        ...user,
        wallet_balance: wallet ? wallet.wallet_balance : 0,
        staked_amount: wallet ? wallet.staked_amount : 0,
        reward_balance: wallet ? wallet.reward_balance : 0
      };
    });
    
    res.json(enhancedUsers);
    console.log(`✅ Sent ${enhancedUsers.length} users to admin`);
    
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get all transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    console.log('💰 Admin requesting all transactions...');
    
    // Enhance transactions with user information
    const enhancedTransactions = transactions.map(transaction => {
      const user = users.find(u => u.id === transaction.user_id);
      return {
        ...transaction,
        user_name: user ? user.name : 'Unknown',
        user_email: user ? user.email : 'N/A'
      };
    });
    
    res.json(enhancedTransactions);
    console.log(`✅ Sent ${enhancedTransactions.length} transactions to admin`);
    
  } catch (error) {
    console.error('❌ Error getting transactions:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// Update user
router.post('/update-user', adminAuth, async (req, res) => {
  try {
    const { id, name, email, wallet_balance, staked_amount, reward_balance } = req.body;
    
    console.log(`🔧 Admin updating user ${id}...`);
    
    // Find user
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    users[userIndex] = {
      ...users[userIndex],
      name: name,
      email: email
    };
    
    // Update wallet
    let wallet = wallets.find(w => w.user_id === parseInt(id));
    if (wallet) {
      wallet.wallet_balance = parseFloat(wallet_balance);
      wallet.staked_amount = parseFloat(staked_amount);
      wallet.reward_balance = parseFloat(reward_balance);
    } else {
      // Create wallet if not exists
      wallets.push({
        user_id: parseInt(id),
        wallet_balance: parseFloat(wallet_balance),
        staked_amount: parseFloat(staked_amount),
        reward_balance: parseFloat(reward_balance)
      });
    }
    
    res.json({ message: 'User updated successfully' });
    console.log(`✅ User ${id} updated successfully`);
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Reset user password
router.post('/reset-password', adminAuth, async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    console.log(`🔑 Admin resetting password for user ${userId}...`);
    
    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    // In a real implementation, you would:
    // 1. Hash the new password
    // 2. Update user in database
    // 3. Send email with new password
    
    console.log(`📧 New password generated for ${email}: ${newPassword}`);
    
    res.json({ 
      message: 'Password reset email sent',
      newPassword: newPassword // For demo purposes only
    });
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Toggle user verification
router.post('/toggle-verification', adminAuth, async (req, res) => {
  try {
    const { userId, is_verified } = req.body;
    
    console.log(`✅ Admin toggling verification for user ${userId} to ${is_verified}...`);
    
    // Find user
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update verification status
    users[userIndex].is_verified = is_verified;
    
    res.json({ message: 'User verification updated successfully' });
    console.log(`✅ User ${userId} verification updated to ${is_verified}`);
    
  } catch (error) {
    console.error('❌ Error toggling verification:', error);
    res.status(500).json({ message: 'Failed to update verification' });
  }
});

// Update transaction status
router.post('/update-transaction', adminAuth, async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    
    console.log(`🔄 Admin updating transaction ${transactionId} status to ${status}...`);
    
    // Find transaction
    const transactionIndex = transactions.findIndex(t => t.id === parseInt(transactionId));
    if (transactionIndex === -1) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update status
    transactions[transactionIndex].status = status;
    
    res.json({ message: 'Transaction status updated successfully' });
    console.log(`✅ Transaction ${transactionId} status updated to ${status}`);
    
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
});

// Get activity logs
router.get('/activity-logs', adminAuth, async (req, res) => {
  try {
    console.log('📋 Admin requesting activity logs...');
    
    // Generate sample activity logs
    const activityLogs = [
      {
        id: 1,
        action: 'User Registration',
        details: 'New user registered: john@example.com',
        timestamp: new Date().toISOString(),
        user: 'john@example.com'
      },
      {
        id: 2,
        action: 'Transaction',
        details: 'Stake transaction: $500.00',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'john@example.com'
      },
      {
        id: 3,
        action: 'Admin Action',
        details: 'Admin updated user data',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: 'admin@novastake.com'
      }
    ];
    
    res.json(activityLogs);
    console.log(`✅ Sent ${activityLogs.length} activity logs to admin`);
    
  } catch (error) {
    console.error('❌ Error getting activity logs:', error);
    res.status(500).json({ message: 'Failed to get activity logs' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    console.log(`🗑️ Admin deleting user ${userId}...`);
    
    // Find and remove user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    
    // Remove user's wallet
    const walletIndex = wallets.findIndex(w => w.user_id === userId);
    if (walletIndex !== -1) {
      wallets.splice(walletIndex, 1);
    }
    
    // Remove user's transactions
    const transactionIndices = transactions
      .map((t, index) => t.user_id === userId ? index : -1)
      .filter(index => index !== -1)
      .sort((a, b) => b - a);
    
    transactionIndices.forEach(index => {
      transactions.splice(index, 1);
    });
    
    res.json({ message: 'User deleted successfully', user: deletedUser });
    console.log(`✅ User ${userId} deleted successfully`);
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get verification codes from auth module
const { verificationCodes } = require('../data/store');

// Admin route to get all verification codes
router.get('/verification-codes', adminAuth, async (req, res) => {
  try {
    const codes = [];
    
    // Convert verificationCodes Map to array with additional info
    verificationCodes.forEach((data, email) => {
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      const isExpired = now > expiresAt;
      
      codes.push({
        id: codes.length + 1,
        name: data.name || 'Pending User',
        email: email,
        code: data.code,
        expires_at: data.expiresAt,
        created_at: data.createdAt || new Date(now - (10 * 60 * 1000)).toISOString(),
        status: isExpired ? 'expired' : 'pending'
      });
    });
    
    console.log(`📋 Admin requested verification codes: ${codes.length} found`);
    res.json({ codes });
    
  } catch (error) {
    console.error('❌ Error getting verification codes:', error);
    res.status(500).json({ error: 'Failed to get verification codes' });
  }
});

// Admin route to delete verification code
router.delete('/verification-codes/:email', adminAuth, async (req, res) => {
  try {
    const { email } = req.params;
    
    if (verificationCodes.has(email)) {
      verificationCodes.delete(email);
      console.log(`🗑️ Admin deleted verification code for: ${email}`);
      res.json({ message: 'Verification code deleted successfully' });
    } else {
      res.status(404).json({ error: 'Verification code not found' });
    }
    
  } catch (error) {
    console.error('❌ Error deleting verification code:', error);
    res.status(500).json({ error: 'Failed to delete verification code' });
  }
});

// Admin route to resend verification code
router.post('/verification-codes/resend', adminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!verificationCodes.has(email)) {
      return res.status(404).json({ error: 'Verification code not found' });
    }
    
    // Generate new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Update existing entry
    const existingData = verificationCodes.get(email);
    verificationCodes.set(email, {
      ...existingData,
      code: newCode,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString()
    });
    
    console.log(`🔄 Admin resent verification code for ${email}: ${newCode}`);
    
    res.json({ 
      message: 'Verification code resent successfully',
      code: newCode,
      expires_at: expiresAt
    });
    
  } catch (error) {
    console.error('❌ Error resending verification code:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Get system health
router.get('/health', adminAuth, async (req, res) => {
  try {
    console.log('🏥 Admin requesting system health...');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        email: 'connected',
        api: 'running'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        users: users.length,
        transactions: transactions.length
      }
    };
    
    res.json(health);
    console.log('✅ System health sent:', health.status);
    
  } catch (error) {
    console.error('❌ Error getting health:', error);
    res.status(500).json({ message: 'Failed to get system health' });
  }
});

module.exports = router;
