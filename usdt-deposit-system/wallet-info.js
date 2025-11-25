const { ethers } = require('ethers');

require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
const mainPrivateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
const mainAddress = process.env.MAIN_WALLET_ADDRESS;

console.log('🔐 NEXCHAIN USDT WALLET INFORMATION\n');
console.log('=' .repeat(80));

console.log('🏦 MAIN DEPOSIT WALLET:');
console.log(`Address: ${mainAddress}`);
console.log(`Private Key: ${mainPrivateKey}`);
console.log('Network: BSC (Binance Smart Chain)');
console.log('Token: USDT (BEP20)');

console.log('\n🔤 HD WALLET MNEMONIC:');
console.log(`Phrase: "${mnemonic}"`);
console.log('Derivation Path: m/44\'/60\'/0\'/0/');

console.log('\n👥 CHILD ADDRESSES FOR USERS:');

// Generate first 10 child addresses
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

for (let i = 1; i <= 10; i++) {
  const childNode = hdNode.deriveChild(i);
  
  console.log(`\n👤 User ${i}:`);
  console.log(`   Address: ${childNode.address}`);
  console.log(`   Private Key: ${childNode.privateKey}`);
  console.log(`   Index: ${i}`);
}

console.log('\n💰 DEPOSIT INSTRUCTIONS:');
console.log('1. Users get unique child addresses for deposits');
console.log('2. All deposits go to individual child addresses');
console.log('3. System monitors each child address for USDT');
console.log('4. Auto-sweep transfers to main wallet when threshold met');

console.log('\n🔐 SECURITY NOTES:');
console.log('1. Main wallet holds all collected funds');
console.log('2. Child addresses are generated deterministically');
console.log('3. Private keys are encrypted in database');
console.log('4. Each user gets unique deposit address');

console.log('\n📱 API USAGE:');
console.log('POST /api/user/wallet/create - Create wallet for user');
console.log('GET /api/user/:id/wallet - Get user wallet info');
console.log('GET /api/user/:id/balance - Check USDT balance');
console.log('GET /api/deposit/:id/address - Get deposit address');

console.log('\n' + '=' .repeat(80));
console.log('🎯 NEXCHAIN USDT - WALLET SYSTEM READY');

// Test current setup
console.log('\n🔍 CURRENT SETUP TEST:');

// Test main wallet
const mainWallet = new ethers.Wallet(mainPrivateKey);
console.log(`✅ Main wallet valid: ${mainWallet.address === mainAddress}`);

// Test HD wallet
const testChild = hdNode.deriveChild(1);
console.log(`✅ HD wallet working: ${testChild.address.startsWith('0x')}`);
console.log(`✅ Child 1 Address: ${testChild.address}`);

console.log('\n🚀 READY FOR PRODUCTION!');
