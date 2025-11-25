const { ethers } = require('ethers');
const { generateChildAddress } = require('../config/wallet');
const User = require('../models/User');
const { encrypt } = require('../utils/encryption');

class WalletService {
  static async createWalletForUser(userId) {
    try {
      // Get next wallet index
      const walletIndex = await User.getNextWalletIndex();
      
      // Generate new wallet address
      const wallet = generateChildAddress(walletIndex);
      
      // Encrypt private key
      const encryptedPrivateKey = encrypt(wallet.privateKey);
      
      // Update user with wallet info
      const db = require('../config/database');
      await db.execute(
        'UPDATE users SET child_address = ?, child_private_key = ?, wallet_index = ? WHERE id = ?',
        [wallet.address, encryptedPrivateKey, walletIndex, userId]
      );
      
      return {
        success: true,
        address: wallet.address,
        index: walletIndex,
        message: 'Wallet created successfully'
      };
      
    } catch (error) {
      console.error('Create wallet error:', error);
      return {
        success: false,
        error: 'Failed to create wallet'
      };
    }
  }
  
  static async getWalletBalance(address) {
    try {
      const { usdtContract } = require('../config/blockchain');
      const balance = await usdtContract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error('Get balance error:', error);
      return 0;
    }
  }
  
  static async validateAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }
  
  static async getTransactionCount(address) {
    try {
      const { provider } = require('../config/blockchain');
      const count = await provider.getTransactionCount(address);
      return count;
    } catch (error) {
      console.error('Get transaction count error:', error);
      return 0;
    }
  }
}

module.exports = WalletService;