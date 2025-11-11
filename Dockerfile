# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build both frontend and backend
RUN npm run build

# This stage can be used for running migrations
# Usage: docker build --target builder -t app-migrations .

# ===== PRODUCTION STAGE =====
FROM node:20-alpine

# Install dumb-init for proper signal handling and psql client for migrations
RUN apk add --no-cache dumb-init postgresql15-client

# Create non-root user
RUN adduser -D -u 10001 appuser

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder (dist contains both frontend and backend)
COPY --from=builder --chown=appuser:appuser /app/dist ./dist

# Copy database schema files and migrations needed for startup
COPY --chown=appuser:appuser db ./db
COPY --chown=appuser:appuser shared ./shared
COPY --chown=appuser:appuser migrations ./migrations
COPY --chown=appuser:appuser scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --chown=appuser:appuser drizzle.config.ts ./
RUN chmod +x ./scripts/docker-entrypoint.sh

# Default runtime port for the web server
ENV WEB_PORT=6000

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 6000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.WEB_PORT || 6000; require('http').get('http://localhost:' + port + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application (runs DB initialization/migrations first)
CMD ["scripts/docker-entrypoint.sh"]
