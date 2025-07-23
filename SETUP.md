# ChillConnect Development Setup Guide

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js 18+** (https://nodejs.org/)
- **PostgreSQL 14+** (https://postgresql.org/)
- **Git** (https://git-scm.com/)

## Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install shared dependencies
cd ../shared && npm install
```

### 2. Database Setup

1. Create a PostgreSQL database named `chillconnect`
2. Update the `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chillconnect"
   ```

3. Run database migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

### 3. Environment Configuration

Update the following files with your configuration:

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chillconnect"

# JWT Secret (Change this!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# PayPal Configuration
PAYPAL_MODE="sandbox"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# AWS Configuration (Optional for development)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="chillconnect-uploads"
```

#### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

### 4. Start Development Servers

```bash
# From the root directory
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

## Development Commands

### Root Directory Commands

```bash
# Start both servers
npm run dev

# Run tests
npm run test

# Build all projects
npm run build

# Run linting
npm run lint
```

### Backend Commands

```bash
cd backend

# Start development server
npm run dev

# Run tests
npm test

# Database commands
npx prisma migrate dev    # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
npx prisma db seed       # Seed database
```

### Frontend Commands

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Preview production build
npm run preview
```

## Testing the Application

### 1. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health Check: http://localhost:5000/health

### 2. Create Test Accounts

1. **Register as a Seeker**:
   - Go to http://localhost:3000/register
   - Fill in the form with role "Seeker"
   - Confirm you're 18+ and give consent

2. **Register as a Provider**:
   - Use a different email
   - Select role "Provider"
   - Complete the verification process

3. **Create Admin Account**:
   - Use the database seeding or create manually
   - Default super admin credentials are in the .env file

### 3. Test Core Features

1. **Authentication**:
   - Login/logout functionality
   - Email verification (check console logs for verification links)
   - Phone verification (OTP will be logged in development)

2. **Token System**:
   - Purchase tokens (use PayPal sandbox)
   - View wallet balance
   - Transaction history

3. **Booking System**:
   - Search for providers
   - Create bookings
   - Chat functionality

4. **Admin Features**:
   - User verification
   - Booking monitoring
   - Content moderation

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key tables:

- `users` - User accounts and authentication
- `user_profiles` - Extended user information
- `bookings` - Service bookings
- `messages` - Chat messages
- `token_wallets` - User token balances
- `verifications` - Document verification queue
- `assignments` - Round-robin task assignments

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/verify-email` - Email verification
- POST `/api/auth/verify-phone` - Phone verification

### Token Management
- GET `/api/tokens/packages` - Available token packages
- POST `/api/tokens/purchase` - Purchase tokens
- GET `/api/tokens/balance` - User balance
- GET `/api/tokens/transactions` - Transaction history

### Booking System
- GET `/api/bookings/search` - Search providers
- POST `/api/bookings/create` - Create booking
- GET `/api/bookings/my-bookings` - User bookings
- PUT `/api/bookings/:id/status` - Update booking status

### Chat System
- GET `/api/chat/conversations` - User conversations
- GET `/api/chat/:bookingId/messages` - Booking messages
- POST `/api/chat/:bookingId/messages` - Send message

### Admin Panel
- GET `/api/admin/dashboard` - Admin dashboard
- GET `/api/admin/users` - User management
- GET `/api/admin/verification-queue` - Verification queue
- GET `/api/admin/booking-monitoring` - Booking monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **Port Already in Use**:
   - Backend: Change PORT in backend/.env
   - Frontend: Change port in vite.config.js

3. **PayPal Integration**:
   - Ensure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set
   - Use sandbox mode for development

4. **AWS Services**:
   - AWS services are optional for development
   - File uploads will fail without S3 configuration
   - Email/SMS features require SES/SNS setup

### Development Tips

1. **Use Prisma Studio**:
   ```bash
   cd backend && npx prisma studio
   ```

2. **Check API Health**:
   ```bash
   curl http://localhost:5000/health
   ```

3. **View Logs**:
   - Backend logs: `backend/logs/`
   - Frontend logs: Browser console

4. **Database Reset**:
   ```bash
   cd backend
   npx prisma migrate reset
   npx prisma db seed
   ```

## Security Notes

⚠️ **Important**: This setup is for development only!

- Change JWT_SECRET in production
- Use environment variables for secrets
- Enable HTTPS in production
- Configure proper CORS settings
- Set up proper AWS IAM roles

## Next Steps

1. **Complete Registration Flow**: Implement full registration with Redux
2. **Add Real PayPal Integration**: Set up PayPal developer account
3. **Implement File Uploads**: Configure AWS S3 for file storage
4. **Add Email/SMS**: Set up AWS SES and SNS
5. **Create Admin Panels**: Build out admin interface
6. **Add Real-time Features**: Complete Socket.io integration
7. **Write Tests**: Add comprehensive test coverage
8. **Deploy**: Set up production deployment

## Support

For development questions or issues:
- Check the logs in `backend/logs/`
- Use Prisma Studio for database inspection
- Test API endpoints with tools like Postman
- Review the browser console for frontend issues

Happy coding! 🚀