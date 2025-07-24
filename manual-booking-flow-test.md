# 🚀 Manual Booking Flow Test Guide

## Complete End-to-End Testing: Seeker Account → Wallet Recharge → Booking → OTP Completion

### Prerequisites
- Frontend running on http://localhost:3000
- Backend running on http://localhost:5001
- Both services accessible and responding

---

## 📋 Step 1: Create Seeker Account

### 1.1 Navigate to Registration
- Open browser: `http://localhost:3000`
- Click "Get Started" or "Sign up here" link
- Should be redirected to: `http://localhost:3000/register`

### 1.2 Fill Registration Form
```
Role: ☑️ SEEKER (select radio button)
First Name: Test
Last Name: Seeker
Email: testseeker@example.com
Phone: 9876543210
Date of Birth: 1995-01-01
Password: TestPass123!
Confirm Password: TestPass123!
☑️ Age Confirmation (check)
☑️ Consent Given (check)
```

### 1.3 Submit Registration
- Click "Register" button
- **Expected**: Should proceed to email/phone verification OR login directly
- **Check**: Account appears in database with SEEKER role

---

## 💰 Step 2: Wallet Recharge

### 2.1 Navigate to Wallet
- From dashboard, click "Wallet" in sidebar
- URL should be: `http://localhost:3000/wallet`

### 2.2 Check Current Balance
- **Expected**: Should see current balance (likely ₹0 for new account)
- **Note**: Record current balance for comparison

### 2.3 Initiate Recharge
- Click "Recharge" or "Add Money" button
- Enter amount: `1000`
- Select payment method (if applicable)
- Click "Confirm Recharge"

### 2.4 Verify Recharge
- **Expected**: Balance should increase by ₹1000
- **Check**: Transaction should appear in wallet history
- **Verify**: Database wallet balance matches UI display

---

## 🔍 Step 3: Search and Book Provider

### 3.1 Navigate to Search
- From dashboard, click "Search" in sidebar
- URL should be: `http://localhost:3000/search`

### 3.2 Search for Providers
- **Expected**: Should see list of available providers
- **If Empty**: May need to create provider accounts first
- **Check**: Provider cards display properly with pricing/details

### 3.3 Select Provider
- Click on any provider card
- **Expected**: Should navigate to provider profile or booking page
- **URL Pattern**: `http://localhost:3000/booking/{providerId}`

### 3.4 Make Booking
```
Service: (select available service)
Date: (tomorrow's date)
Time: 14:00
Duration: 1 hour
Special Requests: Test booking
```
- Click "Confirm Booking"
- **Expected**: Booking should be created
- **Check**: Wallet balance should decrease by booking amount

---

## 📱 Step 4: Provider Side - Accept Booking

### 4.1 Create/Login as Provider
- Open new browser tab/incognito window
- Register/Login as PROVIDER role
- Navigate to provider dashboard

### 4.2 View Pending Bookings
- Check "Bookings" or "Requests" section
- **Expected**: Should see the booking from Step 3
- **Status**: Should be "PENDING" or "REQUESTED"

### 4.3 Accept Booking
- Click "Accept" on the booking
- **Expected**: Booking status changes to "CONFIRMED"
- **Check**: Seeker receives notification

---

## 🏁 Step 5: Complete Booking with OTP

### 5.1 Provider Generates Completion OTP
- In provider dashboard, find the confirmed booking
- Click "Generate Completion Code" or "Complete Service"
- **Expected**: System generates 6-digit OTP
- **Display**: OTP should be shown to provider

### 5.2 Seeker Enters Completion OTP
- Switch back to seeker account
- Navigate to active bookings
- Find the booking in progress
- Click "Complete Booking" or "Enter Completion Code"
- Enter the 6-digit OTP from provider

### 5.3 Verify Completion
- **Expected**: Booking status changes to "COMPLETED"
- **Check**: Payment is released from escrow to provider
- **Verify**: Both seeker and provider can rate/review each other

---

## 🧪 Testing Checklist

### Database Verification
```sql
-- Check user accounts
SELECT * FROM users WHERE email LIKE 'testseeker%';

-- Check wallet transactions
SELECT * FROM wallet_transactions WHERE user_id = ?;

-- Check bookings
SELECT * FROM bookings WHERE seeker_id = ?;

-- Check booking status changes
SELECT * FROM booking_status_history WHERE booking_id = ?;
```

### UI/UX Verification
- [ ] Dark theme consistent across all pages
- [ ] Navigation works smoothly
- [ ] Forms validate properly
- [ ] Error messages display correctly
- [ ] Success notifications appear
- [ ] Real-time updates work (if implemented)

### Functional Verification
- [ ] Account creation successful
- [ ] Email/phone verification (if required)
- [ ] Wallet recharge processes correctly
- [ ] Provider search returns results
- [ ] Booking creation successful
- [ ] Payment escrow works
- [ ] OTP generation and validation
- [ ] Booking completion updates all parties

---

## 🚨 Common Issues & Troubleshooting

### Registration Issues
- **Problem**: Email already exists
- **Solution**: Use unique email or clear database

### Wallet Issues
- **Problem**: Payment gateway not configured
- **Solution**: Check PayPal/payment integration

### Booking Issues
- **Problem**: No providers available
- **Solution**: Create provider accounts first

### OTP Issues
- **Problem**: OTP not generating
- **Solution**: Check SMS/email service configuration

---

## 📊 Success Criteria

✅ **Account Creation**: Seeker account created with proper role
✅ **Wallet Functionality**: Recharge successful, balance updated
✅ **Booking Flow**: End-to-end booking creation works
✅ **Provider Interaction**: Provider can accept bookings
✅ **OTP Completion**: Completion code system functional
✅ **Payment Flow**: Escrow and release working
✅ **Status Updates**: All parties see correct booking status

---

## 🔄 Next Steps After Testing

1. **Document Issues**: Record any bugs or missing features
2. **Performance Check**: Test under load with multiple users
3. **Security Audit**: Verify OTP and payment security
4. **Mobile Testing**: Test on mobile devices
5. **Integration Testing**: Verify all backend APIs work correctly

---

**Manual Testing Time Estimate**: 30-45 minutes for complete flow
**Prerequisites**: Both frontend and backend must be running and accessible