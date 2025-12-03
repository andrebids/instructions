# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Build Client (Vite/React Frontend)
# ============================================
FROM node:20-slim AS client-builder

WORKDIR /app/client

# Copy ONLY package files first (node_modules excluded by .dockerignore)
# This ensures dependencies are installed inside the container, not copied from host
COPY client/package*.json ./

# Install client dependencies with BuildKit cache mounts
# Dependencies are installed inside container, ensuring correct Linux binaries
# Note: --ignore-scripts is removed to allow postinstall scripts that may install platform-specific binaries
RUN --mount=type=cache,target=/root/.npm \
    npm ci && \
    npm install @rollup/rollup-linux-x64-gnu --save-optional --force || true

# Copy client source code AFTER dependencies are installed
# node_modules is excluded by .dockerignore, so only source code is copied
COPY client/ ./

# Build client for production
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# ============================================
# Stage 2: Prepare Server Dependencies
# ============================================
FROM node:20-slim AS server-builder

WORKDIR /app/server

# Copy ONLY package files first (node_modules excluded by .dockerignore)
COPY server/package*.json ./

# Install server production dependencies with BuildKit cache mounts
# Dependencies installed inside container, ensuring correct Linux binaries
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --ignore-scripts

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-slim AS production

# Labels for metadata and versioning
LABEL org.opencontainers.image.title="Instructions Project"
LABEL org.opencontainers.image.description="Fullstack application with React frontend and Express backend"
LABEL org.opencontainers.image.vendor="Instructions Project"

# Install dumb-init for proper signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Create app user for security (combine RUN commands to reduce layers)
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

WORKDIR /app

# Copy root package.json (for shared dependencies if any)
COPY package*.json ./

# Install root dependencies if needed (with cache mount)
# Skip if package.json has no dependencies (empty or only metadata)
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package.json ] && [ -f package-lock.json ]; then \
        npm ci --only=production --ignore-scripts || true; \
    fi

# Copy server code and dependencies
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy built client to server's public directory
COPY --from=client-builder /app/client/dist ./server/public/client

# Create uploads directory with proper permissions (combine with chown)
RUN mkdir -p ./server/public/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check (using node as it's already available)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set working directory to server
WORKDIR /app/server

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
# Note: Migrations should be run separately in production or via init container
CMD ["node", "src/app.js"]
