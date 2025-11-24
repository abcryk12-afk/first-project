const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, wallets } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Email verification storage (in-memory for now)
const verificationCodes = new Map();

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

    console.log(`📧 Verification code for ${email}: ${code} (expires: ${expiresAt})`);

    // Return success with debug code for testing
    res.json({ 
      message: 'Verification code sent successfully',
      email: email,
      debugCode: code // Show code in response for testing
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
