#!/usr/bin/env node

// NovaStake Admin Server Startup Script
const app = require('./src/app');
const { initializeAdminStorage } = require('./src/data/adminStore');

const PORT = process.env.PORT || 3000;

// Initialize admin storage
console.log('🔐 Initializing NovaStake Admin System...');
initializeAdminStorage();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NovaStake Admin Server running on port ${PORT}`);
  console.log(`📊 Admin API available at: http://localhost:${PORT}/api/admin`);
  console.log(`🔐 Admin Login: POST /api/admin/login`);
  console.log(`👤 Admin Register: POST /api/admin/register`);
  console.log(`📋 Admin Accounts: GET /api/admin/accounts`);
  console.log('');
  console.log('🎯 Default Admin Credentials:');
  console.log('📧 Email: admin@novastake.com');
  console.log('🔑 Password: Admin@123456');
  console.log('🔐 Secret Key for registration: 123');
  console.log('');
  console.log('🌐 Frontend URLs:');
  console.log('🔐 Admin Login: http://localhost:4000/admin-login.html');
  console.log('📊 Admin Dashboard: http://localhost:4000/admin.html');
  console.log('⚙️  Admin Setup: http://localhost:4000/admin-setup.html');
});
