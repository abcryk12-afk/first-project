const { ethers } = require('ethers');
const { usdtContract, provider } = require('../config/blockchain');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Sweep = require('../models/Sweep');
const logger = require('../utils/logger');

class DepositListener {
  constructor() {
    this.isRunning = false;
    this.lastBlock = 0;
  }
  
  async start() {
    if (this.isRunning) {
      logger.warn('Deposit listener already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('🚀 Starting deposit listener...');
    
    try {
      // Get current block number
      this.lastBlock = await provider.getBlockNumber();
      logger.info(`📊 Starting from block: ${this.lastBlock}`);
      
      // Listen for Transfer events
      usdtContract.on('Transfer', async (from, to, value, event) => {
        await this.handleTransfer(from, to, value, event);
      });
      
      // Listen for new blocks
      provider.on('block', async (blockNumber) => {
        await this.checkNewBlocks(blockNumber);
      });
      
      logger.info('✅ Deposit listener started successfully');
      
    } catch (error) {
      logger.error('❌ Error starting deposit listener:', error);
      this.isRunning = false;
    }
  }
  
  async handleTransfer(from, to, value, event) {
    try {
      // Convert value to readable amount
      const amount = parseFloat(ethers.formatUnits(value, 18));
      
      // Check if minimum deposit
      if (amount < parseFloat(process.env.MIN_DEPOSIT_AMOUNT || '1')) {
        logger.info(`💰 Amount too small: ${amount} USDT`);
        return;
      }
      
      // Find user by address
      const user = await User.findByAddress(to);
      if (!user) {
        logger.info(`❌ User not found for address: ${to}`);
        return;
      }
      
      // Check if transaction already exists
      const existingTx = await Transaction.findByHash(event.transactionHash);
      if (existingTx) {
        logger.info(`🔄 Transaction already exists: ${event.transactionHash}`);
        return;
      }
      
      // Create transaction record
      await Transaction.create({
        user_id: user.id,
        tx_hash: event.transactionHash,
        from_address: from,
        to_address: to,
        amount: amount,
        confirmations: 0,
        status: 'pending',
        token: 'USDT'
      });
      
      logger.info(`💰 New deposit detected: ${amount} USDT to ${to} (TX: ${event.transactionHash})`);
      
    } catch (error) {
      logger.error('❌ Error handling transfer:', error);
    }
  }
  
  async checkNewBlocks(blockNumber) {
    try {
      if (blockNumber <= this.lastBlock) return;
      
      // Check for events in missed blocks
      const filter = usdtContract.filters.Transfer();
      const events = await usdtContract.queryFilter(
        filter, 
        this.lastBlock + 1, 
        blockNumber
      );
      
      for (const event of events) {
        await this.handleTransfer(
          event.args.from,
          event.args.to,
          event.args.value,
          event
        );
      }
      
      this.lastBlock = blockNumber;
      
    } catch (error) {
      logger.error('❌ Error checking new blocks:', error);
    }
  }
  
  stop() {
    this.isRunning = false;
    usdtContract.removeAllListeners();
    provider.removeAllListeners();
    logger.info('🛑 Deposit listener stopped');
  }
}

module.exports = new DepositListener();