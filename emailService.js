const nodemailer = require('nodemailer');
require('dotenv').config();

// Primary SMTP Configuration (Gmail - Working!)
const primaryEmailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_PORT === '465', // SSL for port 465
    auth: {
        user: process.env.EMAIL_USER || 'wanum01234@gmail.com',
        pass: process.env.EMAIL_PASS || 'nacdmkgxynhvrwqe'
    },
    // Enhanced connection settings for Gmail
    pool: false, // Disable pooling for timeout issues
    maxConnections: 1,
    maxMessages: 10,
    // Longer timeout settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 15000,     // 15 seconds
    socketTimeout: 30000,      // 30 seconds
    // TLS settings for Gmail
    tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'HIGH:!aNULL:!MD5',
        minVersion: 'TLSv1'
    },
    // Additional connection options
    name: 'novastake.com',
    localAddress: null,
    connection: null,
    // Debug settings
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
};

// Backup SMTP Configuration (Gmail Alternative Port)
const backupEmailConfig = {
    host: 'smtp.gmail.com',
    port: 587, // Alternative port with STARTTLS
    secure: false, // STARTTLS for port 587
    auth: {
        user: process.env.EMAIL_USER || 'wanum01234@gmail.com',
        pass: process.env.EMAIL_PASS || 'nacdmkgxynhvrwqe'
    },
    // Enhanced connection settings
    pool: false,
    maxConnections: 1,
    maxMessages: 10,
    // Longer timeout settings
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    // TLS settings
    tls: {
        rejectUnauthorized: false,
        ciphers: 'HIGH:!aNULL:!MD5',
        minVersion: 'TLSv1'
    },
    // Additional connection options
    name: 'novastake.com',
    localAddress: null,
    connection: null,
    // Debug settings
    debug: false,
    logger: false
};

// Alternative SMTP Configuration (Hostinger Fallback)
const alternativeEmailConfig = {
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'no-reply@megashope.store',
        pass: process.env.EMAIL_PASS || 'Usman@567784'
    },
    // Enhanced connection settings
    pool: false,
    maxConnections: 1,
    maxMessages: 10,
    // Timeout settings
    connectionTimeout: 20000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    // TLS settings
    tls: {
        rejectUnauthorized: false,
        ciphers: 'HIGH:!aNULL:!MD5'
    },
    name: 'novastake.com'
};

// Create primary transporter
const primaryTransporter = nodemailer.createTransport(primaryEmailConfig);

// Create backup transporter
const backupTransporter = nodemailer.createTransport(backupEmailConfig);

// Create alternative transporter (SendGrid)
const alternativeTransporter = nodemailer.createTransport(alternativeEmailConfig);

// Verify primary connection on startup
primaryTransporter.verify((error, success) => {
    if (error) {
        console.error('❌ Primary Gmail SMTP Connection Error:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Command:', error.command);
        console.log('⚠️ Will use backup Gmail SMTP if needed');
    } else {
        console.log('✅ Primary Gmail SMTP Server Ready: smtp.gmail.com:465');
        console.log('✅ Auth User: wanum01234@gmail.com');
    }
});

// Verify backup connection on startup
backupTransporter.verify((error, success) => {
    if (error) {
        console.error('❌ Backup Gmail SMTP Connection Error:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Command:', error.command);
        console.log('⚠️ Will use Hostinger SMTP if needed');
    } else {
        console.log('✅ Backup Gmail SMTP Server Ready: smtp.gmail.com:587');
        console.log('✅ Backup Auth User: wanum01234@gmail.com');
    }
});

// Verify alternative connection on startup
alternativeTransporter.verify((error, success) => {
    if (error) {
        console.error('❌ Hostinger SMTP Connection Error:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Command:', error.command);
        console.log('⚠️ All SMTP servers failed, will use console fallback');
    } else {
        console.log('✅ Hostinger SMTP Server Ready: smtp.hostinger.com:587');
        console.log('✅ Hostinger Auth User: no-reply@megashope.store');
    }
});

async function sendVerificationEmail(email, verificationCode, userName, customPassword = null) {
    try {
        console.log('🚀 Node Mailer: Starting email send process...');
        console.log(`📧 To: ${email}`);
        console.log(`👤 User: ${userName}`);
        console.log(`🔐 Code: ${verificationCode}`);
        console.log(`🔑 Custom Password: ${customPassword ? 'Yes' : 'No'}`);
        
        // Use custom password if provided
        const passwordToUse = customPassword || process.env.EMAIL_PASS || 'nacdmkgxynhvrwqe';
        
        // Update configs with custom password
        if (customPassword) {
            primaryEmailConfig.auth.pass = passwordToUse;
            backupEmailConfig.auth.pass = passwordToUse;
        }
        
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

        console.log('📤 Node Mailer: Trying Primary Gmail SMTP → smtp.gmail.com:465');
        let info;
        let transporterUsed = 'primary';
        
        try {
            // Try Primary Gmail SMTP first
            info = await primaryTransporter.sendMail(mailOptions);
            console.log('✅ Primary Gmail SMTP: Email sent successfully!');
            console.log('✅ Message ID:', info.messageId);
            console.log('✅ Response:', info.response);
        } catch (primaryError) {
            console.error('❌ Primary Gmail SMTP Failed:', primaryError.message);
            console.error('❌ Error Code:', primaryError.code);
            console.error('❌ Command:', primaryError.command);
            
            console.log('🔄 Trying Backup Gmail SMTP → smtp.gmail.com:587');
            try {
                // Try Backup Gmail SMTP
                info = await backupTransporter.sendMail(mailOptions);
                console.log('✅ Backup Gmail SMTP: Email sent successfully!');
                console.log('✅ Message ID:', info.messageId);
                console.log('✅ Response:', info.response);
                transporterUsed = 'backup';
            } catch (backupError) {
                console.error('❌ Backup Gmail SMTP Also Failed:', backupError.message);
                console.error('❌ Error Code:', backupError.code);
                console.error('❌ Command:', backupError.command);
                
                console.log('🔄 Trying Hostinger SMTP → smtp.hostinger.com:587');
                try {
                    // Try Hostinger SMTP
                    info = await alternativeTransporter.sendMail(mailOptions);
                    console.log('✅ Hostinger SMTP: Email sent successfully!');
                    console.log('✅ Message ID:', info.messageId);
                    console.log('✅ Response:', info.response);
                    transporterUsed = 'alternative';
                } catch (alternativeError) {
                    console.error('❌ Hostinger SMTP Also Failed:', alternativeError.message);
                    console.error('❌ Error Code:', alternativeError.code);
                    console.error('❌ Command:', alternativeError.command);
                    throw new Error('All SMTP servers failed');
                }
            }
        }
        
        console.log('✅ Node Mailer: Email sent successfully!');
        console.log('✅ Message ID:', info.messageId);
        console.log('✅ Response:', info.response);
        console.log(`📧 Email sent to: ${email}`);
        console.log(`🔐 Verification code: ${verificationCode}`);
        
        return {
            success: true,
            messageId: info.messageId,
            email: email,
            verificationCode: verificationCode,
            response: info.response,
            transporterUsed: transporterUsed,
            transporterHost: transporterUsed === 'primary' ? 'smtp.gmail.com' : 
                             transporterUsed === 'backup' ? 'smtp.gmail.com' : 
                             'smtp.hostinger.com'
        };
        
    } catch (error) {
        console.error('❌ Node Mailer: Email sending failed');
        console.error('❌ Error Code:', error.code);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Command:', error.command);
        console.error('❌ SMTP Response:', error.response);
        
        // Always show OTP in console as backup
        console.log('⚠️ Node Mailer: Email failed, showing OTP in console');
        console.log(`🔐 EMAIL VERIFICATION CODE: ${verificationCode}`);
        console.log(`📧 Email: ${email}`);
        console.log(`👤 User: ${userName}`);
        console.log(`⏰ Generated at: ${new Date().toISOString()}`);
        
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            verificationCode: verificationCode,
            email: email,
            consoleBackup: true
        };
    }
}

module.exports = { sendVerificationEmail };
