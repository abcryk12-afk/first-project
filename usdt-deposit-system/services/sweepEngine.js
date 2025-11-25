const { ethers } = require('ethers');
const { provider, usdtContract, gas } = require('../config/blockchain');
const { getMainWallet } = require('../config/wallet');
const User = require('../models/User');
const Sweep = require('../models/Sweep');
const logger = require('../utils/logger');

class SweepEngine {
  static async processSweeps() {
    try {
      logger.info('🔄 Processing sweep jobs...');
      
      // Get all pending sweeps
      const pendingSweeps = await Sweep.getPendingSweeps();
      
      if (pendingSweeps.length === 0) {
        logger.info('✅ No pending sweeps to process');
        return;
      }
      
      for (const sweep of pendingSweeps) {
        await this.processSweep(sweep);
      }
      
      logger.info(`✅ Processed ${pendingSweeps.length} sweep jobs`);
      
    } catch (error) {
      logger.error('❌ Error processing sweeps:', error);
    }
  }
  
  static async processSweep(sweep) {
    try {
      // Get user info
      const user = await User.findByAddress(sweep.child_address);
      if (!user) {
        logger.error(`❌ User not found for address: ${sweep.child_address}`);
        await Sweep.updateStatus(sweep.id, 'failed');
        return;
      }
      
      // Create wallet instance for child address
      const childWallet = new ethers.Wallet(user.child_private_key, provider);
      const mainWallet = getMainWallet();
      
      // Check USDT balance
      const usdtBalance = await usdtContract.balanceOf(sweep.child_address);
      
      if (usdtBalance === 0n) {
        logger.warn(`⚠️ No USDT balance to sweep: ${sweep.child_address}`);
        await Sweep.updateStatus(sweep.id, 'failed');
        return;
      }
      
      // Check BNB balance for gas
      const bnbBalance = await provider.getBalance(sweep.child_address);
      const minGasRequired = ethers.parseEther('0.00045'); // 0.00045 BNB
      
      // Top up gas if needed
      if (bnbBalance < minGasRequired) {
        await this.topUpGas(sweep.child_address, childWallet, mainWallet);
      }
      
      // Execute sweep
      const sweepTx = await this.executeSweep(childWallet, mainWallet.address, usdtBalance);
      
      // Update sweep status
      await Sweep.updateStatus(sweep.id, 'sent', sweepTx.hash);
      
      logger.info(`✅ Sweep executed: ${ethers.formatUnits(usdtBalance, 18)} USDT (TX: ${sweepTx.hash})`);
      
    } catch (error) {
      logger.error(`❌ Error processing sweep ${sweep.id}:`, error);
      await Sweep.updateStatus(sweep.id, 'failed');
    }
  }
  
  static async topUpGas(childAddress, childWallet, mainWallet) {
    try {
      const gasAmount = ethers.parseEther('0.0005'); // Send 0.0005 BNB
      
      const tx = await mainWallet.sendTransaction({
        to: childAddress,
        value: gasAmount,
        gasLimit: gas.limit,
        gasPrice: gas.price
      });
      
      await tx.wait();
      
      logger.info(`⛽ Gas topped up: ${ethers.formatEther(gasAmount)} BNB to ${childAddress} (TX: ${tx.hash})`);
      
      // Wait a bit for transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      logger.error(`❌ Error topping up gas for ${childAddress}:`, error);
      throw error;
    }
  }
  
  static async executeSweep(childWallet, mainAddress, amount) {
    try {
      // Create contract instance with child wallet
      const usdtWithChild = usdtContract.connect(childWallet);
      
      // Execute transfer
      const tx = await usdtWithChild.transfer(mainAddress, amount, {
        gasLimit: gas.limit,
        gasPrice: gas.price
      });
      
      const receipt = await tx.wait();
      
      logger.info(`💰 Sweep completed: ${ethers.formatUnits(amount, 18)} USDT (TX: ${tx.hash})`);
      
      return tx;
      
    } catch (error) {
      logger.error(`❌ Error executing sweep:`, error);
      throw error;
    }
  }
}

module.exports = SweepEngine;