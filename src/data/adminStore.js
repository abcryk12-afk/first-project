// Admin Database Setup for NovaStake
// This file initializes admin accounts in memory storage

const adminAccounts = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@novastake.com',
    password: 'Admin@123456',
    role: 'super_admin',
    created_at: new Date().toISOString(),
    is_active: true,
    last_login: null
  }
];

// Initialize admin storage
function initializeAdminStorage() {
  // In production, this would connect to a real database
  console.log('🔐 Initializing admin storage...');
  console.log(`✅ Created ${adminAccounts.length} default admin accounts`);
  
  return adminAccounts;
}

// Export for use in admin routes
module.exports = {
  adminAccounts,
  initializeAdminStorage
};
