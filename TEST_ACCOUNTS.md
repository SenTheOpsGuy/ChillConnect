# ChillConnect Test Accounts

## Quick Start

```bash
# 1. Run setup script
./setup-local.sh

# 2. Start backend (in one terminal)
cd backend && npm run dev

# 3. Start frontend (in another terminal)
cd frontend && npm run dev

# 4. Open browser
http://localhost:3000
```

## Test Account Credentials

### 🔐 Admin Accounts

#### Super Administrator
- **Email:** `admin@chillconnect.com`
- **Password:** `Admin@123!`
- **Role:** SUPER_ADMIN
- **Tokens:** 10,000
- **Capabilities:**
  - Full system access
  - User management
  - Template management
  - Dispute resolution
  - Financial oversight
  - Employee roster & leave management

#### Support Administrator
- **Email:** `support@chillconnect.com`
- **Password:** `Support@123!`
- **Role:** ADMIN
- **Tokens:** 5,000
- **Capabilities:**
  - User verification
  - Support ticket management
  - Dispute handling
  - Basic user management

### 👔 Employee Account

#### Team Manager
- **Email:** `manager@chillconnect.com`
- **Password:** `Manager@123!`
- **Role:** EMPLOYEE
- **Tokens:** 1,000
- **Capabilities:**
  - Employee roster management
  - Leave request approval/rejection
  - Team calendar view
  - Basic booking oversight

---

## 🎭 Provider Accounts (Service Providers)

### Provider 1 - Sarah Anderson (Verified)
- **Email:** `provider1@test.com`
- **Password:** `Provider@123!`
- **Location:** Mumbai, Maharashtra
- **Services:** Dinner Date, Social Event, Movie Companion
- **Hourly Rate:** ₹2,000
- **Rating:** 4.8/5 (45 reviews)
- **Tokens:** 5,000
- **Status:** ✅ Verified & Phone Verified

### Provider 2 - Priya Sharma (Verified)
- **Email:** `provider2@test.com`
- **Password:** `Provider@123!`
- **Location:** Delhi NCR
- **Services:** Coffee Meet, Shopping, City Tour
- **Hourly Rate:** ₹1,500
- **Rating:** 4.9/5 (67 reviews)
- **Tokens:** 3,000
- **Status:** ✅ Verified & Phone Verified

### Provider 3 - Anjali Patel (Pending Verification)
- **Email:** `provider3@test.com`
- **Password:** `Provider@123!`
- **Location:** Bangalore, Karnataka
- **Services:** Coffee Meet, Lunch, Dinner Date
- **Hourly Rate:** ₹1,200
- **Rating:** 0/5 (0 reviews)
- **Tokens:** 1,000
- **Status:** ⏳ Pending Verification

---

## 🔍 Seeker Accounts (Service Seekers)

### Seeker 1 - Rahul Verma (Active)
- **Email:** `seeker1@test.com`
- **Password:** `Seeker@123!`
- **Location:** Mumbai, Maharashtra
- **Bio:** Looking for good company for social events and dinners
- **Tokens:** 10,000
- **Status:** ✅ Active

### Seeker 2 - Arjun Kumar (Active)
- **Email:** `seeker2@test.com`
- **Password:** `Seeker@123!`
- **Location:** Bangalore, Karnataka
- **Bio:** Travel enthusiast looking for companions for city exploration
- **Tokens:** 7,500
- **Status:** ✅ Active

### Seeker 3 - Vikram Singh (New)
- **Email:** `seeker3@test.com`
- **Password:** `Seeker@123!`
- **Location:** Delhi NCR
- **Bio:** New to the platform. Interested in casual meetups
- **Tokens:** 5,000
- **Status:** ✅ Active

---

## 🧪 Testing Scenarios

### Scenario 1: Provider Verification Workflow
1. Login as **provider3@test.com** (unverified provider)
2. Upload verification documents
3. Login as **admin@chillconnect.com**
4. Navigate to Verification Queue
5. Approve/reject provider

### Scenario 2: Booking Flow
1. Login as **seeker1@test.com**
2. Browse providers
3. Create booking with provider1@test.com
4. Login as **provider1@test.com**
5. Accept/reject booking
6. Test chat functionality

### Scenario 3: Employee Leave Management
1. Login as **manager@chillconnect.com**
2. Create employee roster entries
3. Submit leave request
4. Approve/reject leave as manager
5. View team calendar

### Scenario 4: Dispute Resolution
1. Create a booking between seeker and provider
2. Login as **seeker2@test.com**
3. File a dispute
4. Login as **admin@chillconnect.com**
5. Resolve dispute

### Scenario 5: Token Purchase & Withdrawal
1. Login as **provider2@test.com**
2. Request withdrawal
3. Login as **admin@chillconnect.com**
4. Approve withdrawal
5. Login as **seeker3@test.com**
6. Purchase tokens via PayPal

---

## 🗄️ Database Access

### PostgreSQL
```bash
# Connect to database
psql -U postgres -d chillconnect_dev

# View all users
SELECT email, role, "isVerified" FROM users;

# View token balances
SELECT u.email, tw.balance FROM token_wallets tw
JOIN users u ON tw."userId" = u.id;

# Reset database
cd backend
npx prisma migrate reset
```

### Prisma Studio
```bash
cd backend
npx prisma studio
```

Access at: http://localhost:5555

---

## 📝 Notes

### Default Password Pattern
All test accounts use the pattern: `[Role]@123!`
- Admin: `Admin@123!`
- Support: `Support@123!`
- Manager: `Manager@123!`
- Provider: `Provider@123!`
- Seeker: `Seeker@123!`

### Token Economics
- 1 Token = ₹100 INR
- Minimum purchase: 10 tokens
- Provider rates range: ₹1,200 - ₹2,000/hour

### API Endpoints
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- API Docs: http://localhost:5000/api/health

### Environment
All test accounts are pre-seeded with:
- ✅ Email verified
- ✅ Age verified
- ✅ Consent given
- ✅ Token wallet created

---

## 🔒 Security Notes

**⚠️ DEVELOPMENT ONLY**
- These credentials are for local development only
- Never use these passwords in production
- JWT secret is weak for development convenience
- AWS credentials are mocked
- PayPal is in sandbox mode

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database if missing
createdb chillconnect_dev
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Seed Fails
```bash
cd backend
npx prisma migrate reset  # Resets DB and re-runs seed
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For issues or questions:
- Check logs in terminal
- Review browser console (F12)
- Check database with Prisma Studio
- Review `.env` files for correct configuration
