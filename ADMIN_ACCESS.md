# NovaStake Admin Panel - Access Guide

## 🔐 Admin Panel Access Commands

### 🌐 Direct Access URLs

#### **Admin Login Page:**
```
http://localhost:3000/admin-login.html
```

#### **Admin Dashboard (after login):**
```
http://localhost:3000/admin.html
```

### 🚀 Render Deployment URLs

#### **Admin Login Page:**
```
https://nova-stake-api.onrender.com/admin-login.html
```

#### **Admin Dashboard (after login):**
```
https://nova-stake-api.onrender.com/admin.html
```

### 🔑 Admin Login Credentials

#### **Demo Credentials:**
```
📧 Email: admin@novastake.com
🔑 Password: Admin@123456
```

### 📱 Browser Access Methods

#### **Method 1: Direct URL**
1. Open browser
2. Type: `http://localhost:3000/admin-login.html`
3. Enter admin credentials
4. Access admin dashboard

#### **Method 2: File Navigation**
1. Open file explorer
2. Navigate to project folder
3. Double-click `admin-login.html`
4. Enter admin credentials

#### **Method 3: Server Running**
1. Start local server: `npm start`
2. Open browser
3. Go to: `http://localhost:4000/admin-login.html`
4. Enter admin credentials

### 🛡️ Security Features

#### **Hidden from Public:**
- ✅ No navigation link on main site
- ✅ Direct URL access only
- ✅ Admin authentication required
- ✅ Token-based session management

#### **Admin Authentication:**
- 🔐 Secure login with credentials
- 🛡️ JWT token authentication
- 🚪 Auto-logout on session expiry
- 📱 Mobile-friendly interface

### 🎯 Admin Panel Features

#### **📊 Dashboard Statistics:**
- Total users count
- Total transactions
- Total staked amount
- Active users
- Recent registrations

#### **👥 User Management:**
- View all users
- Edit user data
- Reset passwords
- Toggle verification status
- Delete users

#### **💰 Transaction Management:**
- View all transactions
- Update transaction status
- Filter by transaction type
- Search transactions

#### **🔧 Admin Tools:**
- Export user data
- Export transaction data
- System health monitoring
- Activity logs

### 🚀 Quick Start Commands

#### **Local Development:**
```bash
# Start server
npm start

# Access admin panel
http://localhost:4000/admin-login.html
```

#### **Render Deployment:**
```bash
# Deploy to Render
# Access admin panel
https://nova-stake-api.onrender.com/admin-login.html
```

### 📱 Mobile Access

#### **Mobile Browser:**
1. Open mobile browser
2. Enter admin URL
3. Login with credentials
4. Access mobile-friendly admin panel

### 🔍 Admin API Endpoints

#### **Authentication:**
```
POST /api/admin/login
```

#### **Statistics:**
```
GET /api/admin/stats
```

#### **User Management:**
```
GET /api/admin/users
POST /api/admin/update-user
POST /api/admin/reset-password
```

#### **Transaction Management:**
```
GET /api/admin/transactions
POST /api/admin/update-transaction
```

### 🎯 Security Notes

#### **Access Control:**
- ✅ Admin panel hidden from main navigation
- ✅ Direct URL access only
- ✅ Authentication required
- ✅ Session management

#### **Production Security:**
- 🔐 Change admin credentials
- 🛡️ Use environment variables
- 🚪 Implement proper JWT tokens
- 📊 Add logging and monitoring

---

## **🎊 Admin Panel Ready!**

### **✅ Access Methods:**
1. **Direct URL:** `/admin-login.html`
2. **File Navigation:** Double-click file
3. **Server Access:** `http://localhost:4000/admin-login.html`

### **✅ Security:**
- 🔐 Hidden from main site
- 🛡️ Authentication required
- 🚪 Secure session management
- 📱 Mobile accessible

### **✅ Features:**
- 📊 Complete dashboard
- 👥 User management
- 💰 Transaction control
- 🔧 Admin tools

**Admin panel ab hidden hai aur sirf direct access se available hai!** 🎉

**Security improved aur admin functionality maintained!** 🚀
