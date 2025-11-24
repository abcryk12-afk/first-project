# NovaStake Backend with Gmail SMTP Email Verification

Complete backend implementation for NovaStake staking platform with Gmail SMTP email verification functionality.

## 🚀 Features

- **Email Verification**: 6-digit code verification with 10-minute expiry
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Gmail SMTP**: Real email delivery via Gmail SMTP service
- **API Endpoints**: RESTful API for registration, login, and dashboard
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Input validation, CORS enabled
- **Professional Templates**: Beautiful HTML email templates

## 📁 Backend Files Structure

```
nwweb21/
├── package.json              # Dependencies and scripts
├── src/
│   ├── server.js             # Main server entry point
│   ├── app.js                # Express app configuration
│   ├── data/
│   │   └── store.js          # In-memory data store
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Authentication routes (Gmail SMTP)
│       ├── wallet.js         # Wallet management
│       ├── stake.js          # Staking functionality
│       ├── transactions.js   # Transaction history
│       └── withdraw.js       # Withdrawal functionality
├── .env                      # Environment variables
└── Frontend HTML files
    ├── register.html         # Registration with email verification
    ├── login.html            # User login
    ├── dashboard.html        # User dashboard
    ├── stake.html            # Staking interface
    ├── transactions.html     # Transaction history
    └── withdraw.html         # Withdrawal interface
```

## 🛠️ Gmail SMTP Configuration

### Environment Variables (.env)
```env
# Gmail SMTP Configuration
GMAIL_EMAIL=wanum01234@gmail.com
GMAIL_PASSWORD=yocbixqhzciwvkfx

# JWT Configuration
JWT_SECRET=novastake-super-secret-jwt-key-2024

# Server Configuration
PORT=4000
```

### Gmail App Password Setup
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Enable 2-Step Verification
3. Go to Security → App passwords
4. Select "Other (Custom name)" → "NovaStake"
5. Copy the 16-digit password
6. Use it as `GMAIL_PASSWORD`

## 🌐 API Endpoints

### Authentication
```
GET  /api/health                    # Health check
GET  /api/auth/test-email          # Test Gmail SMTP
POST /api/auth/send-verification   # Send verification code
POST /api/auth/verify-email        # Verify email & register
POST /api/auth/login               # User login
```

### Business Logic
```
GET  /api/wallet/                  # Get wallet balance
GET  /api/wallet/dashboard-summary # Dashboard summary
POST /api/stake/                   # Create stake
GET  /api/transactions/             # Get transaction history
POST /api/withdraw/                # Withdraw funds
```

## 📧 Email Templates

Professional HTML email templates with:
- NovaStake branding
- Clear verification code display
- 10-minute expiry notice
- Mobile-responsive design
- Professional styling

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Create MySQL database and run setup script
mysql -u root -p < database-setup.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your credentials
nano .env
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Environment Variables

Create `.env` file with:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=novastake
JWT_SECRET=novastake-super-secret-jwt-key-2024
PORT=3000
EMAIL_USER=wanum01234@gmail.com
EMAIL_PASS=nacdmkgxynhvrwqe
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-verification` - Send verification code
- `POST /api/auth/verify-email` - Verify email and complete registration
- `POST /api/auth/register` - Direct registration (backward compatibility)
- `POST /api/auth/login` - User login

### Dashboard
- `GET /api/wallet/dashboard-summary` - Get wallet data (requires auth)

### Health Check
- `GET /health` - Server health status

## 🔄 Email Verification Flow

1. **User submits registration form** → Frontend calls `/api/auth/send-verification`
2. **System generates 6-digit code** → Stores in database with 10-minute expiry
3. **Email sent to user** → Beautiful HTML email with verification code
4. **User enters code** → Frontend calls `/api/auth/verify-email`
5. **System verifies code** → Creates user account and returns JWT token
6. **User can now login** → Use JWT token for authenticated requests

## 📧 Email Templates

Emails are sent with professional HTML templates featuring:
- NovaStake branding
- Clear verification code display
- Expiry information
- Mobile-responsive design
- Security notices

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - User full name
- `email` - Unique email address
- `password` - Hashed password
- `is_verified` - Email verification status
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Verification Codes Table
- `id` - Primary key
- `email` - User email (unique)
- `code` - 6-digit verification code
- `expires_at` - Code expiration time
- `created_at` - Code generation timestamp

### Wallet Data Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `wallet_balance` - Current wallet balance
- `staked_amount` - Total staked amount
- `reward_balance` - Available rewards
- `daily_rewards_estimate` - Daily reward estimate
- `monthly_rewards_estimate` - Monthly reward estimate
- `apy_rate` - Annual percentage yield

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Email format, password strength, code format
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable allowed origins
- **Rate Limiting**: Ready for implementation
- **HTTPS Ready**: Production-ready security

## 📱 Frontend Integration

The backend works seamlessly with the updated `register.html` frontend:
- Two-step registration process
- Real-time code validation
- Timer functionality
- Error handling
- Mobile-responsive design

## 🧪 Testing

### Test Email Verification
```bash
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test Registration Completion
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "name": "Test User",
    "password": "testpassword123"
  }'
```

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Set production values in `.env`
2. **Database**: Use production MySQL instance
3. **Email Service**: Configure production email service
4. **HTTPS**: Enable SSL/TLS
5. **Process Manager**: Use PM2 or similar
6. **Reverse Proxy**: Nginx or Apache

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Logging

The server provides comprehensive logging:
- Request logging with timestamps
- Database connection status
- Email sending status
- Error details
- User registration events

## 🔄 Maintenance

- **Code Cleanup**: Automatic cleanup of expired verification codes
- **Database Optimization**: Regular table optimization
- **Log Rotation**: Implement log rotation for production
- **Security Updates**: Keep dependencies updated

## 🤝 Support

For issues and support:
1. Check server logs for error details
2. Verify database connection
3. Test email service configuration
4. Check CORS settings
5. Validate environment variables

---

**NovaStake Backend** - Secure, scalable, and production-ready staking platform backend. 🚀
