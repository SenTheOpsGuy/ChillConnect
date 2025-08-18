# Use official Node.js runtime
FROM node:22-slim

# Install PostgreSQL client for psql command
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install root dependencies
RUN npm install

# Copy all application files
COPY . .

# Change to backend directory and run the complete build process
WORKDIR /app/backend

# Install backend dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Deploy migrations and create employee user at runtime
# RUN if [ -n "$DATABASE_URL" ]; then \
#       npx prisma migrate deploy && \
#       psql $DATABASE_URL -f create-employee-user.sql || true; \
#     fi

# Expose port
EXPOSE 5000

# Make start script executable
RUN chmod +x start.sh

# Start the application with setup script
CMD ["./start.sh"]