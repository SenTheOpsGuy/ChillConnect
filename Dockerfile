# Simple Node.js application for Elastic Beanstalk
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Start the application
CMD ["npm", "start"]