# Railway Dockerfile for ChillConnect Backend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy prisma directory with schema and migrations
COPY backend/prisma/ ./backend/prisma/

# Generate Prisma client
RUN cd backend && npx prisma generate

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the backend application
CMD ["node", "backend/railway-start.js"]