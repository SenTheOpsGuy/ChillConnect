# ChillConnect Testing Documentation

Comprehensive testing guide for the ChillConnect adult services booking platform.

## 📋 Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Strategy](#testing-strategy)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Compliance Testing](#compliance-testing)
- [Test Data Management](#test-data-management)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## 🎯 Testing Philosophy

Our testing approach prioritizes:

1. **User Safety**: Age verification and content moderation
2. **Financial Security**: Payment processing and token management
3. **Privacy Protection**: Data encryption and access controls
4. **Platform Reliability**: Booking system and real-time features
5. **Regulatory Compliance**: Adult content and privacy regulations

## 📊 Testing Strategy

### Testing Pyramid

```
    🔺 E2E Tests (5%)
   🔺🔺 Integration Tests (15%)
  🔺🔺🔺 Unit Tests (80%)
```

### Test Coverage Requirements

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| **Frontend** | 80%+ | N/A | Critical flows |
| **Backend** | 85%+ | 70%+ | API endpoints |
| **Mobile** | 75%+ | N/A | Core features |

## 🎨 Frontend Testing

### Technology Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: V8 Coverage

### Test Categories

#### 1. Component Tests

**Authentication Components**
```javascript
// Example: Login component test
describe('Login Component', () => {
  it('should validate email format', async () => {
    render(<Login />)
    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
  })
})
```

**Booking Components**
- Form validation
- Date/time selection
- Token amount calculation
- Service type selection

**Chat Components**
- Message rendering
- File upload handling
- Real-time updates
- Typing indicators

#### 2. Redux Store Tests

**Auth Slice**
```javascript
describe('authSlice', () => {
  it('should handle loginSuccess', () => {
    const payload = { user: testUser, token: 'test-token' }
    const actual = authReducer(initialState, loginSuccess(payload))
    
    expect(actual.isAuthenticated).toBe(true)
    expect(actual.user).toEqual(payload.user)
  })
})
```

**Booking Slice**
- Booking creation
- Status updates
- Error handling

**Wallet Slice**
- Token transactions
- Balance updates
- Payment processing

#### 3. Hook Tests

**Custom Hooks**
- Authentication hooks
- API data fetching
- Real-time updates
- Form management

#### 4. Service Tests

**API Services**
- Request/response handling
- Error handling
- Authentication headers
- Data transformation

### Test Utilities

```javascript
// Custom render with providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    ),
    ...options
  })
}
```

## 🔧 Backend Testing

### Technology Stack

- **Test Runner**: Jest
- **HTTP Testing**: Supertest
- **Database**: PostgreSQL (test instance)
- **Mocking**: Jest mocks

### Test Categories

#### 1. Unit Tests

**Route Handlers**
```javascript
describe('Auth Routes', () => {
  it('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      age: 25,
      consentGiven: true
    }

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.user.email).toBe(userData.email)
  })
})
```

**Service Functions**
- OTP generation and verification
- Payment processing
- Email/SMS services
- File upload handling

**Middleware**
- Authentication
- Authorization
- Rate limiting
- Error handling

**Database Operations**
- CRUD operations
- Relationship handling
- Data validation
- Migration testing

#### 2. Integration Tests

**Complete Booking Flow**
```javascript
describe('Booking Integration', () => {
  it('should complete booking lifecycle', async () => {
    // Create seeker and provider
    const seeker = await createTestUser()
    const provider = await createTestProvider()
    
    // Create booking
    const booking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send(bookingData)
      .expect(201)
    
    // Confirm booking
    await request(app)
      .put(`/api/bookings/${booking.body.booking.id}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200)
    
    // Verify token transfer
    const wallet = await request(app)
      .get('/api/tokens/wallet')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200)
    
    expect(wallet.body.wallet.balance).toBe(expectedBalance)
  })
})
```

**API Endpoint Flows**
- Authentication flow
- Token purchase flow
- Chat messaging flow
- Admin verification flow

#### 3. Database Tests

**Prisma Operations**
- Model relationships
- Data constraints
- Transaction handling
- Migration validation

### Test Setup

```javascript
// Test database setup
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Booking" CASCADE`
  // ... other cleanup
})

beforeEach(async () => {
  // Seed test data
  await seedTestData()
})
```

## 🎭 End-to-End Testing

### Technology Stack

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Emulated devices

### Test Categories

#### 1. Critical User Journeys

**User Registration & Verification**
```javascript
test('should complete user registration flow', async ({ page }) => {
  await page.goto('/register')
  
  // Fill registration form
  await page.fill('[data-testid="email-input"]', 'e2e@example.com')
  await page.fill('[data-testid="password-input"]', 'Password123!')
  await page.check('[data-testid="consent-checkbox"]')
  
  // Submit and verify redirect
  await page.click('[data-testid="register-button"]')
  await expect(page).toHaveURL('/verify-email')
})
```

**Booking Process**
- Provider search
- Booking creation
- Payment processing
- Chat initiation
- Service completion

**Payment Flows**
- Token purchase
- Escrow handling
- Refund processing
- Wallet management

#### 2. Admin Workflows

**User Verification**
- Document review
- Account approval/rejection
- Status updates

**Platform Management**
- User management
- Booking monitoring
- Dispute resolution

#### 3. Mobile Testing

**Responsive Design**
- Touch interactions
- Mobile navigation
- Camera integration
- Push notifications

### Test Data

```javascript
// E2E test data setup
const testUsers = {
  seeker: { email: 'seeker@e2e.com', password: 'Test123!' },
  provider: { email: 'provider@e2e.com', password: 'Test123!' },
  admin: { email: 'admin@e2e.com', password: 'Test123!' }
}
```

## ⚡ Performance Testing

### Load Testing (Artillery.js)

**Configuration**
```yaml
config:
  target: 'https://api.chillconnect.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 25
    - duration: 300
      arrivalRate: 50

scenarios:
  - name: "Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
```

**Performance Targets**
- Response time: <500ms (95th percentile)
- Throughput: 100 RPS sustained
- Error rate: <1%
- Availability: 99.9%

### Frontend Performance (Lighthouse CI)

**Metrics**
- Performance Score: 80+
- Accessibility: 90+
- Best Practices: 85+
- SEO: 80+

## 🔒 Security Testing

### Automated Security Scans

**Dependency Scanning (Snyk)**
- Vulnerability detection
- License compliance
- Remediation recommendations

**Code Analysis (CodeQL)**
- Static analysis
- Security pattern detection
- Custom security rules

**Secret Scanning (TruffleHog)**
- API key detection
- Password detection
- Sensitive data identification

### Manual Security Testing

**Authentication & Authorization**
- JWT token validation
- Role-based access control
- Session management
- Password policies

**Input Validation**
- SQL injection prevention
- XSS protection
- CSRF prevention
- File upload security

**Data Protection**
- Encryption at rest
- Encryption in transit
- Data masking
- PII handling

## ⚖️ Compliance Testing

### Age Verification Testing

**Document Upload Validation**
```javascript
test('should validate age verification documents', async ({ page }) => {
  await page.goto('/verify')
  
  // Upload invalid document
  await page.setInputFiles('[data-testid="document-upload"]', 'invalid-doc.txt')
  await page.click('[data-testid="submit-verification"]')
  
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Only PDF, JPG, PNG files allowed')
})
```

**Access Control Verification**
- Age-restricted content access
- Provider verification requirements
- Geographic restrictions

### Privacy Compliance (GDPR)

**Data Subject Rights**
- Data export functionality
- Data deletion requests
- Consent management
- Privacy policy compliance

**Audit Trail Testing**
- Access logging
- Data modification tracking
- Compliance reporting

## 📊 Test Data Management

### Test User Creation

```javascript
// Backend test helpers
global.createTestUser = async (userData = {}) => {
  const user = await prisma.user.create({
    data: {
      email: userData.email || 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: userData.role || 'USER',
      isVerified: true,
      isAgeVerified: true,
      consentGiven: true,
      ...userData
    }
  })
  
  // Create associated profile and wallet
  await createUserProfile(user.id, userData.profile)
  await createTokenWallet(user.id)
  
  return user
}
```

### Database Seeding

```javascript
// Test data seeding
const seedTestData = async () => {
  await createTestUser({ email: 'seeker@test.com', role: 'SEEKER' })
  await createTestProvider({ email: 'provider@test.com', role: 'PROVIDER' })
  await createTestAdmin({ email: 'admin@test.com', role: 'ADMIN' })
}
```

## 🚀 Running Tests

### Local Development

```bash
# Frontend tests
cd frontend
npm run test          # Run tests in watch mode
npm run test:ci       # Run tests once with coverage
npm run test:ui       # Open Vitest UI

# Backend tests
cd backend
npm run test          # Run all tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:watch    # Run tests in watch mode

# E2E tests
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run with UI mode
```

### CI/CD Environment

```bash
# Full test suite
npm run test:frontend
npm run test:backend
npm run test:e2e

# With coverage
npm run test:ci
```

### Performance Testing

```bash
# Load testing
artillery run .github/load-tests/basic-load.yml

# Frontend performance
npm run lighthouse
```

## ✍️ Writing Tests

### Test Structure (AAA Pattern)

```javascript
describe('Feature/Component Name', () => {
  // Arrange
  beforeEach(() => {
    // Setup test data and environment
  })

  it('should do something specific', async () => {
    // Arrange - Set up test data
    const testData = { /* ... */ }
    
    // Act - Execute the behavior being tested
    const result = await performAction(testData)
    
    // Assert - Verify the expected outcome
    expect(result).toEqual(expectedResult)
  })
})
```

### Test Naming Conventions

```javascript
// Good: Descriptive and specific
it('should return 401 when JWT token is expired')
it('should create booking with valid provider and seeker')
it('should validate email format in registration form')

// Bad: Vague or unclear
it('should work')
it('should test login')
it('should handle error')
```

### Mock Guidelines

```javascript
// External service mocks
jest.mock('../services/brevoService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendOTPEmail: jest.fn().mockResolvedValue({ success: true })
}))

// Component mocks
jest.mock('../components/ComplexComponent', () => {
  return function MockComplexComponent(props) {
    return <div data-testid="mock-complex-component" {...props} />
  }
})
```

## 📋 Best Practices

### Test Quality

1. **Independent Tests**
   - Each test should be able to run in isolation
   - No dependencies between tests
   - Proper setup and teardown

2. **Deterministic Tests**
   - Consistent results across runs
   - No random data without seeds
   - Fixed date/time values

3. **Fast Tests**
   - Mock external dependencies
   - Use test databases
   - Minimize I/O operations

### Test Maintenance

1. **Regular Review**
   - Remove obsolete tests
   - Update test data
   - Refactor duplicated code

2. **Documentation**
   - Clear test descriptions
   - Inline comments for complex logic
   - README for test setup

3. **Monitoring**
   - Track test execution time
   - Monitor flaky tests
   - Coverage trend analysis

### Security Testing

1. **Sensitive Data**
   - Never use real user data
   - Mask sensitive information
   - Secure test environment

2. **Test Isolation**
   - Separate test databases
   - Isolated test environments
   - Clean state between tests

### Compliance Testing

1. **Regular Audits**
   - Age verification workflows
   - Privacy compliance checks
   - Content moderation testing

2. **Documentation**
   - Test evidence collection
   - Compliance reporting
   - Audit trail maintenance

---

*Last Updated: January 2025*
*Version: 1.0.0*