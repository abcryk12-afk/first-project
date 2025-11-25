const { ethers } = require('ethers');
const { provider } = require('../config/blockchain');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Sweep = require('../models/Sweep');
const logger = require('../utils/logger');

class ConfirmationHandler {
  static async checkConfirmations() {
    try {
      logger.info('🔍 Checking transaction confirmations...');
      
      // Get all pending transactions
      const pendingTxs = await Transaction.getPendingTransactions();
      
      if (pendingTxs.length === 0) {
        logger.info('✅ No pending transactions to check');
        return;
      }
      
      const currentBlock = await provider.getBlockNumber();
      
      for (const tx of pendingTxs) {
        await this.processTransaction(tx, currentBlock);
      }
      
      logger.info(`✅ Processed ${pendingTxs.length} pending transactions`);
      
    } catch (error) {
      logger.error('❌ Error checking confirmations:', error);
    }
  }
  
  static async processTransaction(tx, currentBlock) {
    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(tx.tx_hash);
      
      if (!receipt) {
        logger.warn(`⚠️ Transaction not found: ${tx.tx_hash}`);
        return;
      }
      
      // Calculate confirmations
      const confirmations = currentBlock - receipt.blockNumber;
      
      // Update confirmations
      await Transaction.updateStatus(tx.tx_hash, 'pending', confirmations);
      
      // Check if confirmed (3 confirmations required)
      if (confirmations >= 3) {
        await this.confirmTransaction(tx);
      } else {
        logger.info(`⏳ Transaction ${tx.tx_hash} has ${confirmations}/3 confirmations`);
      }
      
    } catch (error) {
      logger.error(`❌ Error processing transaction ${tx.tx_hash}:`, error);
    }
  }
  
  static async confirmTransaction(tx) {
    try {
      // Update transaction status to completed
      await Transaction.updateStatus(tx.tx_hash, 'completed');
      
      // Update user balance
      await User.updateBalance(tx.user_id, tx.amount);
      
      // Create sweep job
      await Sweep.create({
        child_address: tx.to_address,
        amount: tx.amount,
        status: 'pending'
      });
      
      logger.info(`✅ Transaction confirmed: ${tx.amount} USDT (TX: ${tx.tx_hash})`);
      logger.info(`🔄 Sweep job created for ${tx.to_address}`);
      
    } catch (error) {
      logger.error(`❌ Error confirming transaction ${tx.tx_hash}:`, error);
    }
  }
}

module.exports = ConfirmationHandler;