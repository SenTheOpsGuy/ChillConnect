# Adult Services Booking Platform

A secure, token-based booking platform with comprehensive monitoring and escrow system.

## Features

- 18+ Age verification system
- Token-based payments (1 token = 100 INR)
- PayPal integration
- Real-time chat with monitoring
- Incall/Outcall booking types
- Multi-role admin system
- Round-robin assignment
- AWS services integration

## Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Payment**: PayPal SDK
- **Cloud**: AWS (SES, SNS, S3, RDS)

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build
```

## Project Structure

```
booking-platform/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

## User Roles

- **Seeker**: Books services
- **Provider**: Offers services
- **Employee**: Verifies accounts and monitors bookings
- **Manager**: Manages teams and operations
- **Admin**: Regional platform management
- **Super Admin**: Platform-wide control

## Compliance

- 18+ age verification
- GDPR compliance
- PCI DSS payment security
- Content moderation
- Audit trails