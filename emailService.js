const nodemailer = require('nodemailer');

// Use environment variables with fallbacks
const gmailEmail = process.env.EMAIL_USER || 'wanum01234@gmail.com';
const gmailPassword = process.env.EMAIL_PASS || 'nacdmkgxynhvrwqe';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465 (SSL), false for other ports
  auth: {
    user: gmailEmail,
    pass: gmailPassword
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 5,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000      // 60 seconds
});

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

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries}: Sending email to ${email}`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully to:', email);
      console.log('📧 Message ID:', result.messageId);
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // If it's the last attempt, don't wait
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error('❌ All email sending attempts failed');
  return { 
    success: false, 
    error: lastError.message,
    code: lastError.code || 'EMAIL_SEND_FAILED'
  };
}

module.exports = { sendVerificationEmail };
