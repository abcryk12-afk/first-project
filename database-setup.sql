-- NovaStake Database Setup
-- Run these SQL commands to set up your database

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS novastake;
USE novastake;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  code VARCHAR(6),
  expires_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_code (code),
  INDEX idx_expires_at (expires_at)
);

-- Create wallet_data table (for existing functionality)
CREATE TABLE IF NOT EXISTS wallet_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_balance DECIMAL(20,8) DEFAULT 0.00000000,
  staked_amount DECIMAL(20,8) DEFAULT 0.00000000,
  reward_balance DECIMAL(20,8) DEFAULT 0.00000000,
  daily_rewards_estimate DECIMAL(20,8) DEFAULT 0.00000000,
  monthly_rewards_estimate DECIMAL(20,8) DEFAULT 0.00000000,
  apy_rate DECIMAL(5,2) DEFAULT 12.50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Create transactions table (for existing functionality)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('stake', 'unstake', 'reward', 'deposit', 'withdraw') NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Insert some sample data for testing
INSERT INTO wallet_data (user_id, wallet_balance, staked_amount, reward_balance) 
VALUES (1, 1250.75000000, 500.00000000, 25.12345678)
ON DUPLICATE KEY UPDATE 
wallet_balance = VALUES(wallet_balance),
staked_amount = VALUES(staked_amount),
reward_balance = VALUES(reward_balance);

-- Sample transactions
INSERT INTO transactions (user_id, type, amount, description, status) VALUES
(1, 'stake', 500.00000000, 'Initial staking amount', 'completed'),
(1, 'reward', 25.12345678, 'Monthly rewards earned', 'completed'),
(1, 'deposit', 750.75000000, 'Initial wallet deposit', 'completed');

-- Show table structures
DESCRIBE users;
DESCRIBE verification_codes;
DESCRIBE wallet_data;
DESCRIBE transactions;

-- Test queries
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as verification_codes_count FROM verification_codes;
