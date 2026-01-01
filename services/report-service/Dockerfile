# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/prisma-client ./packages/prisma-client

# Copy service
COPY services/report-service ./services/report-service

# Install dependencies
RUN npm ci --workspace=@lapor-pakdhe/shared --workspace=@lapor-pakdhe/prisma-client --workspace=@lapor-pakdhe/report-service

# Generate Prisma client
RUN npx prisma generate --schema=./packages/prisma-client/prisma/schema.prisma

# Build shared package
RUN npm run build --workspace=@lapor-pakdhe/shared

# Build service
RUN npm run build --workspace=@lapor-pakdhe/report-service

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/prisma-client ./packages/prisma-client
COPY --from=builder /app/services/report-service/dist ./services/report-service/dist
COPY --from=builder /app/services/report-service/package.json ./services/report-service/

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/services/report-service

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8002/health || exit 1

# Start service
CMD ["node", "dist/index.js"]
