const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, wallets } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Email verification storage (in-memory for now)
const verificationCodes = new Map();

// Console-based verification code system
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code to console
async function sendVerificationEmail(email, code) {
  console.log('='.repeat(60));
  console.log('🔐 EMAIL VERIFICATION CODE');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`🔢 Code: ${code}`);
  console.log(`⏰ Expires in: 10 minutes`);
  console.log('='.repeat(60));
  console.log('📋 Copy this code and use it in the registration form');
  console.log('='.repeat(60));
  
  return { 
    success: true, 
    mode: 'console',
    debugCode: code,
    message: 'Verification code sent to console'
  };
}

// Helper to create JWT
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Comprehensive Gmail SMTP Diagnostic
async function diagnoseGmailSMTP() {
  console.log('🔍 Starting Gmail SMTP Diagnosis...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {},
    gmailConfig: {},
    connectionTest: {},
    authTest: {},
    finalStatus: 'unknown'
  };

  // 1. Environment Check
  diagnostics.environment = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'MISSING',
    PORT: process.env.PORT || 4000
  };

  // 2. Gmail Configuration Check
  diagnostics.gmailConfig = {
    email: gmailEmail,
    emailValid: gmailEmail && gmailEmail.includes('@gmail.com'),
    passwordSet: !!gmailPassword,
    passwordLength: gmailPassword ? gmailPassword.length : 0,
    appPasswordFormat: gmailPassword && gmailPassword.length === 16 && !gmailPassword.includes(' '), // 16 chars, no spaces
    envEmailUser: process.env.EMAIL_USER,
    envEmailPass: process.env.EMAIL_PASS ? 'SET' : 'MISSING'
  };

  // 3. Connection Test
  try {
    console.log('🔗 Testing Gmail SMTP connection...');
    
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465 (SSL), false for other ports
      auth: {
        user: gmailEmail,
        pass: gmailPassword
      },
      connectionTimeout: 30000, // 30 seconds for test
      greetingTimeout: 15000,   // 15 seconds for test
      socketTimeout: 30000      // 30 seconds for test
    });

    // Test connection
    await testTransporter.verify();
    
    diagnostics.connectionTest = {
      status: 'SUCCESS',
      message: 'Gmail SMTP connection verified successfully',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Gmail SMTP connection test PASSED');

  } catch (error) {
    diagnostics.connectionTest = {
      status: 'FAILED',
      message: error.message,
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      commonCauses: getCommonCauses(error.code, error.message)
    };

    console.error('❌ Gmail SMTP connection test FAILED:', error.message);
  }

  // 4. Authentication Test (if connection passed)
  if (diagnostics.connectionTest.status === 'SUCCESS') {
    try {
      console.log('🔐 Testing Gmail authentication...');
      
      const authTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465 (SSL), false for other ports
        auth: {
          user: gmailEmail,
          pass: gmailPassword
        }
      });

      // Test with a real email send (to self)
      const testResult = await authTransporter.sendMail({
        from: gmailEmail,
        to: gmailEmail, // Send to self for testing
        subject: 'NovaStake - Gmail SMTP Test',
        text: 'This is a test email to verify Gmail SMTP is working.',
        html: '<p>This is a test email to verify Gmail SMTP is working.</p>'
      });

      diagnostics.authTest = {
        status: 'SUCCESS',
        message: 'Gmail authentication and email send test passed',
        messageId: testResult.messageId,
        timestamp: new Date().toISOString()
      };

      console.log('✅ Gmail authentication test PASSED');

    } catch (error) {
      diagnostics.authTest = {
        status: 'FAILED',
        message: error.message,
        code: error.code || 'UNKNOWN',
        timestamp: new Date().toISOString(),
        commonCauses: getCommonCauses(error.code, error.message)
      };

      console.error('❌ Gmail authentication test FAILED:', error.message);
    }
  }

  // 5. Final Status
  diagnostics.finalStatus = 
    diagnostics.connectionTest.status === 'SUCCESS' && 
    (!diagnostics.authTest.status || diagnostics.authTest.status === 'SUCCESS') 
    ? 'WORKING' : 'FAILED';

  return diagnostics;
}

// Get common causes for Gmail SMTP errors
function getCommonCauses(errorCode, errorMessage) {
  const causes = [];

  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    causes.push('Network connection timeout - Check internet connection');
    causes.push('Firewall blocking SMTP ports (587, 465, 25)');
    causes.push('Gmail SMTP servers temporarily down');
  }

  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
    causes.push('DNS resolution failed - Check DNS settings');
    causes.push('Gmail SMTP servers unreachable');
  }

  if (errorMessage.includes('535') || errorMessage.includes('authentication failed')) {
    causes.push('Incorrect Gmail password or App Password');
    causes.push('2-Step Verification not enabled');
    causes.push('App Password not generated correctly');
  }

  if (errorMessage.includes('534') || errorMessage.includes('application-specific password')) {
    causes.push('App Password required - Enable 2-Step Verification');
    causes.push('Generate App Password from Google Account settings');
  }

  if (errorMessage.includes('550') || errorMessage.includes('relay denied')) {
    causes.push('Gmail account not verified');
    causes.push('Sending limits exceeded');
  }

  if (!causes.length) {
    causes.push('Unknown error - Check Gmail account settings');
    causes.push('Ensure Gmail SMTP is enabled in Google Account');
  }

  return causes;
}

// Test email service endpoint (enhanced)
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Starting comprehensive Gmail SMTP test...');
    
    const diagnostics = await diagnoseGmailSMTP();
    
    // Return detailed diagnostics
    res.json({
      testType: 'COMPREHENSIVE_GMAIL_SMTP_DIAGNOSTIC',
      timestamp: diagnostics.timestamp,
      finalStatus: diagnostics.finalStatus,
      environment: diagnostics.environment,
      gmailConfig: diagnostics.gmailConfig,
      connectionTest: diagnostics.connectionTest,
      authTest: diagnostics.authTest,
      recommendations: getRecommendations(diagnostics),
      nextSteps: getNextSteps(diagnostics.finalStatus)
    });

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Diagnostic test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get recommendations based on diagnostics
function getRecommendations(diagnostics) {
  const recommendations = [];

  if (diagnostics.gmailConfig.emailValid === false) {
    recommendations.push('📧 Fix: Ensure EMAIL_USER is a valid Gmail address');
  }

  if (diagnostics.gmailConfig.passwordSet === false) {
    recommendations.push('🔑 Fix: Set EMAIL_PASS environment variable');
  }

  if (diagnostics.gmailConfig.appPasswordFormat === false) {
    recommendations.push('🔐 Fix: Use 16-character App Password without spaces (format: xxxxxxxxxxxxxxxx)');
  }

  if (diagnostics.connectionTest.status === 'FAILED') {
    recommendations.push('🌐 Fix: Check internet connection and firewall settings');
    recommendations.push('🔥 Fix: Ensure SMTP ports (587, 465, 25) are not blocked');
  }

  if (diagnostics.authTest && diagnostics.authTest.status === 'FAILED') {
    recommendations.push('🔐 Fix: Generate new App Password from Google Account settings');
    recommendations.push('📱 Fix: Enable 2-Step Verification on Gmail account');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Gmail SMTP is properly configured and working');
  }

  return recommendations;
}

// Get next steps based on final status
function getNextSteps(finalStatus) {
  if (finalStatus === 'WORKING') {
    return [
      '✅ Gmail SMTP is working - No action needed',
      '📧 Email verification will work properly',
      '🚀 Your application is ready to send emails'
    ];
  }

  return [
    '🔧 Fix the issues mentioned in recommendations',
    '🔄 Restart your server after making changes',
    '🧪 Run this test again to verify fixes',
    '📧 Consider using console fallback if Gmail continues to fail'
  ];
}

// Send verification code
router.post('/send-verification', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0,
      name: name || 'Pending User',
      createdAt: new Date().toISOString()
    });

    console.log(` Sending verification code for ${email}: ${code} (expires: ${expiresAt})`);

    const emailResult = await sendVerificationEmail(email, code);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({ 
      message: 'Verification code sent successfully',
      email: email,
      emailService: 'console',
      debugCode: code,
      consoleMessage: 'Check server console for verification code'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code, name, password } = req.body;

    if (!email || !code || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid verification code format' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const verification = verificationCodes.get(email.toLowerCase());
    
    if (!verification) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    if (verification.code !== code) {
      verification.attempts++;
      if (verification.attempts >= 3) {
        verificationCodes.delete(email.toLowerCase());
        return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
      }
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > verification.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Verification code expired' });
    }

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = users.length + 1;
    const user = {
      id,
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    users.push(user);

    const wallet = {
      id,
      userId: id,
      balance: 1000.0,
      stakedBalance: 0.0,
      rewardBalance: 0.0,
      updatedAt: new Date().toISOString(),
    };
    wallets.push(wallet);

    verificationCodes.delete(email.toLowerCase());

    const token = createToken(user);

    console.log(` User registered: ${email} with ID: ${id}`);

    res.status(201).json({
      message: 'Registration successful',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        isVerified: user.isVerified
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user);

    console.log(` User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Webhook endpoint for Resend email events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('📧 Resend webhook received:', {
      type: event.type,
      created_at: event.created_at,
      data: event.data
    });
    
    // Handle different webhook events
    switch (event.type) {
      case 'email.delivered':
        console.log('✅ Email delivered:', event.data.email_id);
        break;
        
      case 'email.complained':
        console.log('⚠️ Email complained:', event.data.email_id);
        break;
        
      case 'email.bounced':
        console.log('❌ Email bounced:', event.data.email_id);
        break;
        
      case 'email.opened':
        console.log('👁️ Email opened:', event.data.email_id);
        break;
        
      case 'email.clicked':
        console.log('🖱️ Email clicked:', event.data.email_id);
        break;
        
      default:
        console.log('📋 Unknown webhook event:', event.type);
    }
    
    // Always return 200 OK to Resend
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(200).json({ received: true }); // Still return 200 to avoid retries
  }
});

module.exports = router;
