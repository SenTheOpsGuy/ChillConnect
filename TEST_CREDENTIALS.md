# 🔑 ChillConnect Test Credentials

## 🌐 Access URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001

## 👥 Test Accounts

### 👑 Super Admin
- **Email**: admin@chillconnect.com
- **Password**: admin123
- **Role**: SUPER_ADMIN
- **Access**: Full platform access, user management, admin dashboard

### 👔 Manager
- **Email**: manager@chillconnect.com
- **Password**: manager123
- **Role**: MANAGER
- **Access**: User management, verification queue, booking monitoring

### 🏢 Employees
- **Employee 1**: employee1@chillconnect.com / employee1123
- **Employee 2**: employee2@chillconnect.com / employee2123
- **Employee 3**: employee3@chillconnect.com / employee3123
- **Role**: EMPLOYEE
- **Access**: Verification queue, booking monitoring

### 💼 Providers
- **Provider 1**: provider1@chillconnect.com / provider1123 ✅ (Verified)
- **Provider 2**: provider2@chillconnect.com / provider2123 ✅ (Verified)
- **Provider 3**: provider3@chillconnect.com / provider3123 ✅ (Verified)
- **Provider 4**: provider4@chillconnect.com / provider4123 ⏳ (Pending Verification)
- **Provider 5**: provider5@chillconnect.com / provider5123 ⏳ (Pending Verification)
- **Role**: PROVIDER
- **Access**: Booking management, messages, wallet

### 🔍 Seekers
- **Seeker 1**: seeker1@chillconnect.com / seeker1123 ✅ (Verified)
- **Seeker 2**: seeker2@chillconnect.com / seeker2123 ✅ (Verified)
- **Seeker 3**: seeker3@chillconnect.com / seeker3123 ✅ (Verified)
- **Seeker 4**: seeker4@chillconnect.com / seeker4123 ✅ (Verified)
- **Seeker 5**: seeker5@chillconnect.com / seeker5123 ✅ (Verified)
- **Seeker 6**: seeker6@chillconnect.com / seeker6123 ✅ (Verified)
- **Seeker 7**: seeker7@chillconnect.com / seeker7123 ✅ (Verified)
- **Seeker 8**: seeker8@chillconnect.com / seeker8123 ⏳ (Pending Verification)
- **Seeker 9**: seeker9@chillconnect.com / seeker9123 ⏳ (Pending Verification)
- **Seeker 10**: seeker10@chillconnect.com / seeker10123 ⏳ (Pending Verification)
- **Role**: SEEKER
- **Access**: Search providers, booking, messages, wallet

## 📊 Test Data Available

### 📅 Bookings
- **15 bookings** with different statuses (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- Various booking types (OUTCALL, INCALL)
- Different time slots and durations

### 💬 Messages
- **5-15 messages per booking** with realistic conversation flows
- Read/unread status tracking
- Some flagged messages for testing moderation

### 💰 Token Transactions
- **30 transactions** across all users
- Different transaction types (PURCHASE, BOOKING_PAYMENT, BOOKING_REFUND, WITHDRAWAL)
- PayPal integration test data

### 🔍 Verifications
- **8 verification requests** in different states
- Document uploads and review notes
- Employee assignments

## 🧪 Testing Scenarios

### 🔍 Seeker Testing
1. **Login**: seeker1@chillconnect.com / seeker1123
2. **Search**: Browse providers on /search page
3. **Booking**: Create new bookings with providers
4. **Messages**: Chat with providers about bookings
5. **Wallet**: Check token balance and transactions

### 💼 Provider Testing
1. **Login**: provider1@chillconnect.com / provider1123
2. **Dashboard**: View booking requests and schedule
3. **Messages**: Communicate with seekers
4. **Profile**: Update services and availability
5. **Wallet**: Track earnings and withdrawals

### 👑 Admin Testing
1. **Login**: admin@chillconnect.com / admin123
2. **User Management**: View and manage all users
3. **Verification Queue**: Review pending verifications
4. **Booking Monitoring**: Monitor active bookings
5. **Dashboard**: View platform statistics

### 🏢 Employee Testing
1. **Login**: employee1@chillconnect.com / employee1123
2. **Verification Queue**: Process identity verifications
3. **Booking Monitoring**: Monitor booking safety
4. **Assignment**: Handle escalated issues

## 🛠️ Development Notes

### 🔄 Restarting Services
- Frontend: Already running on port 3001
- Backend: Already running on port 5001
- Database: PostgreSQL with seeded data

### 🧹 Reset Data
To reset all test data:
```bash
npm run seed
```

### 📝 Logs
- Backend logs: Available in terminal
- Frontend logs: Available in browser console

## 🎯 Key Features to Test

### ✅ Fixed Issues
- **Messages Page**: Now displays conversations with fallback mock data
- **Search Page**: Functional with provider cards and filters
- **Profile Page**: Proper UI alignment and responsive design
- **Chat Page**: Real-time messaging with socket connections

### 🔐 Security Features
- JWT authentication
- Role-based access control
- Input validation and sanitization
- CSRF protection

### 💳 Payment Features
- Token-based payment system
- Escrow functionality
- PayPal integration
- Transaction history

### 🔄 Real-time Features
- WebSocket-based chat
- Real-time notifications
- Live booking updates

## 📞 Support
If you encounter any issues:
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify credentials are correct
4. Ensure both servers are running

Happy testing! 🚀