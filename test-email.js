const nodemailer = require('nodemailer');

// Enhanced Gmail SMTP configuration
const gmailEmail = process.env.EMAIL_USER || 'wanum01234@gmail.com';
const gmailPassword = process.env.EMAIL_PASS || 'nacd mkgx ynhv rwqe';

// Create a transporter object with enhanced settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail, // Your full Gmail address
    pass: gmailPassword, // The 16-character app password
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 5,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});

// Enhanced email options with HTML support
const mailOptions = {
  from: `"NovaStake" <${gmailEmail}>`,
  to: 'recipient-email@example.com',
  subject: 'Test Email from NovaStake',
  text: 'Hello, this is a test email sent using an app password with Nodemailer.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #1f2937; text-align: center;">NovaStake Test Email</h1>
        <p style="color: #6b7280; line-height: 1.6;">
          Hello, this is a test email sent using an app password with Nodemailer.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <div style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block;">
            ✅ Email Sent Successfully
          </div>
        </div>
      </div>
    </div>
  `
};

// Send the email with enhanced error handling
async function sendTestEmail() {
  try {
    console.log('📧 Sending test email...');
    
    // Test connection first
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email successfully sent:', result.messageId);
    console.log('📧 Response:', result.response);
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('🔍 Error code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.log('💡 Check your Gmail App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Check your internet connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timed out - try again');
    }
    
    return { success: false, error: error.message };
  }
}

// Send the test email
sendTestEmail();
