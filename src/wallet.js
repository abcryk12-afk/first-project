const express = require('express');
const { authRequired } = require('../middleware/auth');
const { wallets, stakes } = require('../data/store');

const router = express.Router();

const APR = 0.12; // 12% APR

function updateRewardsForUser(userId) {
  const wallet = wallets.find((w) => w.userId === userId);
  if (!wallet) return;

  const now = Date.now();

  stakes
    .filter((s) => s.userId === userId && s.status === 'ACTIVE')
    .forEach((stake) => {
      const last = stake.lastRewardAt ? new Date(stake.lastRewardAt).getTime() : new Date(stake.startDate).getTime();
      const deltaMs = now - last;
      if (deltaMs <= 0) return;
      const deltaDays = deltaMs / (1000 * 60 * 60 * 24);
      const rewardIncrement = stake.amount * APR * (deltaDays / 365);
      wallet.rewardBalance += rewardIncrement;
      stake.lastRewardAt = new Date(now).toISOString();
    });

  wallet.updatedAt = new Date().toISOString();
}

router.get('/', authRequired, (req, res) => {
  const userId = req.user.id;
  const wallet = wallets.find((w) => w.userId === userId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  updateRewardsForUser(userId);

  res.json({
    balance: wallet.balance,
    stakedBalance: wallet.stakedBalance,
    rewardBalance: wallet.rewardBalance,
    updatedAt: wallet.updatedAt,
  });
});

router.get('/dashboard-summary', authRequired, (req, res) => {
  const userId = req.user.id;
  const wallet = wallets.find((w) => w.userId === userId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  updateRewardsForUser(userId);

  const userStakes = stakes.filter((s) => s.userId === userId && s.status === 'ACTIVE');
  const totalStaked = userStakes.reduce((sum, s) => sum + s.amount, 0);

  const dailyRewardsEstimate = totalStaked * APR / 365;
  const monthlyRewardsEstimate = totalStaked * APR / 12;

  res.json({
    walletBalance: wallet.balance,
    stakedAmount: totalStaked,
    rewardBalance: wallet.rewardBalance,
    dailyRewardsEstimate,
    monthlyRewardsEstimate,
  });
});

module.exports = router;
