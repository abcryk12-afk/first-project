const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { users, wallets } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Email verification storage (in-memory for now)
const verificationCodes = new Map();

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
let resend = null;

if (resendApiKey) {
  try {
    resend = new Resend(resendApiKey);
    console.log(' Resend email service initialized');
    console.log(' API Key found:', resendApiKey.substring(0, 10) + '...');
  } catch (error) {
    console.log(' Resend initialization failed:', error.message);
    console.log(' Using console fallback');
  }
} else {
  console.log(' RESEND_API_KEY not found in environment variables');
  console.log(' Using console fallback mode');
}

// Send verification email function
async function sendVerificationEmail(email, code) {
  // If Resend is not available, fallback to console
  if (!resend) {
    console.log(` Console fallback - Verification code for ${email}: ${code}`);
    return { success: true, mode: 'console' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'NovaStake <onboarding@resend.dev>',
      to: [email],
      subject: 'NovaStake - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">NS</span>
              </div>
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">NovaStake</h1>
              <p style="color: #6b7280; margin: 8px 0 0; font-size: 16px;">Email Verification</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <div style="font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; line-height: 1;">${code}</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                This code will expire in <strong style="color: #ef4444;">10 minutes</strong>.
              </p>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
                If you didn')t request this verification, please ignore this email.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                 2024 NovaStake. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                Secure Web3 Staking Platform
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (error) {
      console.error(' Resend email sending failed:', error);
      console.log(` Email failed - Console fallback for ${email}: ${code}`);
      return { success: true, mode: 'console', error: error.message };
    }

    console.log(' Verification email sent to:', email);
    console.log(' Email ID:', data.id);
    return { success: true, mode: 'Resend', emailId: data.id };
  } catch (error) {
    console.error(' Email sending failed:', error.message);
    console.log(` Email failed - Console fallback for ${email}: ${code}`);
    return { success: true, mode: 'console', error: error.message };
  }
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

// Test email service endpoint
router.get('/test-email', async (req, res) => {
  try {
    if (!resend) {
      return res.json({ 
        status: 'unavailable',
        message: 'Resend service not configured - API key missing',
        mode: 'console fallback',
        apiKeyFound: !!resendApiKey,
        apiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'none'
      });
    }

    const testCode = '123456';
    const testEmail = 'test@example.com';
    
    const result = await sendVerificationEmail(testEmail, testCode);
    
    if (result.success) {
      res.json({ 
        status: 'success',
        message: 'Resend email service is working',
        mode: result.mode,
        testEmail: testEmail,
        testCode: testCode,
        emailId: result.emailId
      });
    } else {
      res.json({ 
        status: 'failed',
        message: 'Resend email service verification failed',
        mode: result.mode
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      mode: 'console fallback'
    });
  }
});

// Send verification code
router.post('/send-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    
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
      attempts: 0
    });

    console.log(` Sending verification code for ${email}: ${code} (expires: ${expiresAt})`);

    const emailResult = await sendVerificationEmail(email, code);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.json({ 
      message: 'Verification code sent successfully',
      email: email,
      emailService: emailResult.mode,
      emailId: emailResult.emailId,
      debugCode: emailResult.mode === 'console' ? code : undefined
    });
  } catch (err) {
    next(err);
  }
});

// Verify email and complete registration
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

module.exports = router;
