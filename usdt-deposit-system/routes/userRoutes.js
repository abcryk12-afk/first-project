require('dotenv').config();
const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

// Create wallet for user
router.post('/wallet/create', UserController.createWallet);

// Get user balance
router.get('/:userId/balance', UserController.getBalance);

// Get deposit history
router.get('/:userId/deposits', UserController.getDepositHistory);

// Get wallet info
router.get('/:userId/wallet', UserController.getWalletInfo);

module.exports = router;