# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Build Client (Vite/React Frontend)
# ============================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production --ignore-scripts

# Copy client source code
COPY client/ ./

# Build client for production
RUN npm run build

# ============================================
# Stage 2: Prepare Server Dependencies
# ============================================
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server production dependencies only
RUN npm ci --only=production --ignore-scripts

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy root package.json (for shared dependencies if any)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts || true

# Copy server code and dependencies
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy built client to server's public directory
COPY --from=client-builder /app/client/dist ./server/public/client

# Create uploads directory with proper permissions
RUN mkdir -p ./server/public/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set working directory to server
WORKDIR /app/server

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
# Note: Migrations should be run separately in production or via init container
CMD ["node", "src/app.js"]
