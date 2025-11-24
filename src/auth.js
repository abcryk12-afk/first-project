const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { users, wallets } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Email verification storage (in-memory for now)
const verificationCodes = new Map();

// Email service setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wanum01234@gmail.com',
    pass: 'yocb ixqh zciw vkfx'
  }
});

// Send verification email function
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: 'NovaStake <wanum01234@gmail.com>',
    to: email,
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
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 NovaStake. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
              Secure Web3 Staking Platform
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
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

// Send verification code
router.post('/send-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store verification code (in production, use database)
    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0
    });

    console.log(`📧 Sending verification code for ${email}: ${code} (expires: ${expiresAt})`);

    // Send actual email
    const emailSent = await sendVerificationEmail(email, code);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.json({ 
      message: 'Verification code sent successfully',
      email: email
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

    // Validate inputs
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid verification code format' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check verification code
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

    // Check if user already exists (double check)
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
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

    // Create wallet
    const wallet = {
      id,
      userId: id,
      balance: 1000.0,
      stakedBalance: 0.0,
      rewardBalance: 0.0,
      updatedAt: new Date().toISOString(),
    };
    wallets.push(wallet);

    // Clean up verification code
    verificationCodes.delete(email.toLowerCase());

    const token = createToken(user);

    console.log(`✅ User registered: ${email} with ID: ${id}`);

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

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = users.length + 1;
    const user = {
      id,
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
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

    const token = createToken(user);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
