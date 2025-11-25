const express = require('express');
const DepositController = require('../controllers/depositController');

const router = express.Router();

// Get deposit address
router.get('/:userId/address', DepositController.getDepositAddress);

// Check deposit status
router.get('/status/:txHash', DepositController.checkDepositStatus);

// Get pending deposits
router.get('/:userId/pending', DepositController.getPendingDeposits);

// Verify transaction
router.post('/verify', DepositController.verifyTransaction);

module.exports = router;