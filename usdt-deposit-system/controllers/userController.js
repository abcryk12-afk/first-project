require('dotenv').config();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateChildAddress } = require('../config/wallet');

class UserController {
  static async createWallet(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Check if user exists, if not create one
      let user = await User.findById(userId);
      if (!user) {
        // Auto-create user if not found
        const db = require('../config/database');
        const [result] = await db.execute(
          'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
          [`User${userId}`, `user${userId}@nexchain.com`, 'default_password']
        );
        user = await User.findById(result.insertId);
        console.log(`✅ Auto-created user ${userId}`);
      }
      
      // Generate new wallet address
      const walletIndex = await User.getNextWalletIndex();
      const wallet = generateChildAddress(walletIndex);
      
      // Update user with new wallet
      const { encrypt } = require('../utils/encryption');
      const encryptedPrivateKey = encrypt(wallet.privateKey);
      
      await db.execute(
        'UPDATE users SET child_address = ?, child_private_key = ?, wallet_index = ? WHERE id = ?',
        [wallet.address, encryptedPrivateKey, walletIndex, userId]
      );
      
      res.json({
        success: true,
        address: wallet.address,
        message: 'Wallet created successfully'
      });
      
    } catch (error) {
      console.error('Create wallet error:', error);
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  }
  
  static async getBalance(req, res) {
    try {
      const { userId } = req.params;
      
      const balance = await User.getBalance(userId);
      
      res.json({
        success: true,
        balance: balance,
        message: 'Balance retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: 'Failed to get balance' });
    }
  }
  
  static async getDepositHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      
      const transactions = await Transaction.getDeposits(userId);
      
      res.json({
        success: true,
        transactions: transactions,
        message: 'Deposit history retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get deposit history error:', error);
      res.status(500).json({ error: 'Failed to get deposit history' });
    }
  }
  
  static async getWalletInfo(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const balance = await User.getBalance(userId);
      
      res.json({
        success: true,
        address: user.child_address,
        balance: balance,
        walletIndex: user.wallet_index,
        message: 'Wallet info retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get wallet info error:', error);
      res.status(500).json({ error: 'Failed to get wallet info' });
    }
  }
}

module.exports = UserController;