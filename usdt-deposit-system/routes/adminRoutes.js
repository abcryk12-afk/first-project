const express = require('express');
const AdminController = require('../controllers/adminController');

const router = express.Router();

// Get all users
router.get('/users', AdminController.getAllUsers);

// Get all transactions
router.get('/transactions', AdminController.getAllTransactions);

// Get sweep history
router.get('/sweeps', AdminController.getSweepHistory);

// Get system stats
router.get('/stats', AdminController.getSystemStats);

// Retry failed sweeps
router.post('/sweeps/retry', AdminController.retryFailedSweeps);

module.exports = router;