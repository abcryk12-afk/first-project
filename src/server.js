require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 4000;

// Environment Variable Validation
console.log('🔍 Checking Environment Variables...');
const envCheck = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
  EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'MISSING',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING'
};

console.log('📊 Environment Status:', envCheck);

// Gmail SMTP Configuration Check
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Gmail SMTP configuration found');
  console.log(`📧 Email: ${process.env.EMAIL_USER}`);
  console.log(`🔑 Password: ${process.env.EMAIL_PASS.length} characters`);
  
  // Check App Password format
  const hasSpaces = process.env.EMAIL_PASS.includes(' ');
  const correctLength = process.env.EMAIL_PASS.length === 16; // 16 chars, no spaces
  
  if (!hasSpaces && correctLength) {
    console.log('✅ App Password format looks correct');
  } else {
    console.log('⚠️ App Password format may be incorrect');
    console.log('💡 Expected format: 16 characters without spaces');
  }
} else {
  console.log('❌ Gmail SMTP configuration missing');
  console.log('💡 Please set EMAIL_USER and EMAIL_PASS in .env file');
}

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(` NovaStake backend running on http://localhost:${PORT}`);
  console.log(' Server started successfully');
  
  // Final environment status
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('🚀 Gmail SMTP is ready for email sending');
  } else {
    console.log('📧 Gmail SMTP not configured - will use console fallback');
  }
});
