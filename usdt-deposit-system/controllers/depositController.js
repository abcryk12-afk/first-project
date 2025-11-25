const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Sweep = require('../models/Sweep');
const { usdtContract } = require('../config/blockchain');

class DepositController {
  static async getDepositAddress(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.child_address) {
        return res.status(400).json({ error: 'User wallet not created' });
      }
      
      res.json({
        success: true,
        depositAddress: user.child_address,
        token: 'USDT',
        network: 'BSC',
        message: 'Deposit address retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get deposit address error:', error);
      res.status(500).json({ error: 'Failed to get deposit address' });
    }
  }
  
  static async checkDepositStatus(req, res) {
    try {
      const { txHash } = req.params;
      
      const transaction = await Transaction.findByHash(txHash);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json({
        success: true,
        transaction: transaction,
        message: 'Transaction status retrieved successfully'
      });
      
    } catch (error) {
      console.error('Check deposit status error:', error);
      res.status(500).json({ error: 'Failed to check deposit status' });
    }
  }
  
  static async getPendingDeposits(req, res) {
    try {
      const { userId } = req.params;
      
      const transactions = await Transaction.getUserTransactions(userId);
      const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
      
      res.json({
        success: true,
        pendingTransactions: pendingTransactions,
        message: 'Pending deposits retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get pending deposits error:', error);
      res.status(500).json({ error: 'Failed to get pending deposits' });
    }
  }
  
  static async verifyTransaction(req, res) {
    try {
      const { txHash } = req.body;
      
      // Get transaction from blockchain
      const receipt = await usdtContract.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return res.status(404).json({ error: 'Transaction not found on blockchain' });
      }
      
      const confirmations = await usdtContract.provider.getBlockNumber() - receipt.blockNumber;
      
      res.json({
        success: true,
        confirmations: confirmations,
        status: confirmations >= 3 ? 'confirmed' : 'pending',
        message: 'Transaction verification completed'
      });
      
    } catch (error) {
      console.error('Verify transaction error:', error);
      res.status(500).json({ error: 'Failed to verify transaction' });
    }
  }
}

module.exports = DepositController;