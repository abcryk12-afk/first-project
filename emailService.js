const nodemailer = require('nodemailer');

// Email configuration using the provided details
const emailConfig = {
    host: 'mail.megashope.store',
    port: 587,
    secure: false, // false for STARTTLS
    auth: {
        user: 'no-reply@megashope.store',
        pass: 'Usman@567784'
    }
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

async function sendVerificationEmail(email, verificationCode, userName) {
    try {
        const mailOptions = {
            from: '"NovaStake" <no-reply@megashope.store>',
            to: email,
            subject: 'Verify Your NovaStake Account',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px; color: white; font-weight: bold;">NS</div>
                            <h1 style="color: #2d3748; margin: 0; font-size: 28px;">Welcome to NovaStake!</h1>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 18px;">Email Verification</h2>
                            <p style="color: #4a5568; margin: 0; font-size: 16px;">Hi ${userName},</p>
                            <p style="color: #4a5568; margin: 10px 0; font-size: 16px;">Thank you for registering with NovaStake! To complete your registration, please use the verification code below:</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 8px; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);">${verificationCode}</div>
                        </div>
                        
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #718096; margin: 0; font-size: 14px; text-align: center;">
                                <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                            </p>
                        </div>
                        
                        <div style="margin: 30px 0;">
                            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Next Steps:</h3>
                            <ol style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 14px;">
                                <li style="margin: 10px 0;">Enter this verification code on the registration page</li>
                                <li style="margin: 10px 0;">Your account will be immediately activated</li>
                                <li style="margin: 10px 0;">Access your dashboard and explore staking packages</li>
                            </ol>
                        </div>
                        
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                            <p style="color: #718096; margin: 0; font-size: 12px; text-align: center;">
                                If you didn't request this verification, please ignore this email.<br>
                                This is an automated message from NovaStake Platform.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <span style="color: #667eea; font-weight: bold; font-size: 14px;">NovaStake Team</span>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully:', info.messageId);
        console.log(`📧 Email sent to: ${email}`);
        console.log(`🔐 Verification code: ${verificationCode}`);
        
        return {
            success: true,
            messageId: info.messageId,
            code: verificationCode
        };

    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { sendVerificationEmail };
