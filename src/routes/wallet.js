const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, stakes } = require('../data/store');

const router = express.Router();

const APR = 0.12;

function updateRewardsForUser(userId) {
  const wallet = wallets.find((w) => w.userId === userId);
  const userStakes = stakes.filter((s) => s.userId === userId);
  
  if (wallet && userStakes.length > 0) {
    const totalRewards = userStakes.reduce((acc, stake) => {
      const daysStaked = (Date.now() - new Date(stake.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const dailyReward = (stake.amount * APR) / 365;
      return acc + (dailyReward * daysStaked);
    }, 0);
    
    wallet.rewardBalance = totalRewards;
    wallet.updatedAt = new Date().toISOString();
  }
}

router.get('/', authRequired, (req, res) => {
  updateRewardsForUser(req.user.id);
  const wallet = wallets.find((w) => w.userId === req.user.id);
  
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  res.json({
    balance: wallet.balance,
    stakedBalance: wallet.stakedBalance,
    rewardBalance: wallet.rewardBalance,
    updatedAt: wallet.updatedAt,
  });
});

module.exports = router;
