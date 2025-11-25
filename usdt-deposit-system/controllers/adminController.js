const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Sweep = require('../models/Sweep');
const db = require('../config/database');

class AdminController {
  static async getAllUsers(req, res) {
    try {
      const [rows] = await db.execute(`
        SELECT id, name, email, child_address, balance_usdt, wallet_index, created_at, status 
        FROM users 
        ORDER BY created_at DESC
      `);
      
      res.json({
        success: true,
        users: rows,
        message: 'Users retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
  
  static async getAllTransactions(req, res) {
    try {
      const { limit = 100, status } = req.query;
      
      let sql = `
        SELECT t.*, u.name, u.email 
        FROM transactions t 
        JOIN users u ON t.user_id = u.id
      `;
      let params = [];
      
      if (status) {
        sql += ' WHERE t.status = ?';
        params.push(status);
      }
      
      sql += ' ORDER BY t.created_at DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const [rows] = await db.execute(sql, params);
      
      res.json({
        success: true,
        transactions: rows,
        message: 'Transactions retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }
  
  static async getSweepHistory(req, res) {
    try {
      const { limit = 100 } = req.query;
      
      const sweeps = await Sweep.getSweepHistory(parseInt(limit));
      
      res.json({
        success: true,
        sweeps: sweeps,
        message: 'Sweep history retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get sweep history error:', error);
      res.status(500).json({ error: 'Failed to get sweep history' });
    }
  }
  
  static async getSystemStats(req, res) {
    try {
      // Get total users
      const [userStats] = await db.execute('SELECT COUNT(*) as totalUsers FROM users');
      
      // Get total transactions
      const [txStats] = await db.execute('SELECT COUNT(*) as totalTxs, SUM(amount) as totalAmount FROM transactions WHERE status = "completed"');
      
      // Get pending transactions
      const [pendingTxs] = await db.execute('SELECT COUNT(*) as pendingTxs FROM transactions WHERE status = "pending"');
      
      // Get total sweeps
      const [sweepStats] = await db.execute('SELECT COUNT(*) as totalSweeps, SUM(amount) as totalSwept FROM sweeps WHERE status = "sent"');
      
      res.json({
        success: true,
        stats: {
          totalUsers: userStats[0].totalUsers,
          totalTransactions: txStats[0].totalTxs,
          totalAmount: txStats[0].totalAmount || 0,
          pendingTransactions: pendingTxs[0].pendingTxs,
          totalSweeps: sweepStats[0].totalSweeps,
          totalSwept: sweepStats[0].totalSwept || 0
        },
        message: 'System stats retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({ error: 'Failed to get system stats' });
    }
  }
  
  static async retryFailedSweeps(req, res) {
    try {
      const [rows] = await db.execute(`
        UPDATE sweeps 
        SET status = 'pending' 
        WHERE status = 'failed'
      `);
      
      res.json({
        success: true,
        retriedSweeps: rows.affectedRows,
        message: 'Failed sweeps retried successfully'
      });
      
    } catch (error) {
      console.error('Retry failed sweeps error:', error);
      res.status(500).json({ error: 'Failed to retry sweeps' });
    }
  }
}

module.exports = AdminController;