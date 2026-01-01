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
COPY services/user-service ./services/user-service

# Install dependencies
RUN npm ci --workspace=@lapor-pakdhe/shared --workspace=@lapor-pakdhe/prisma-client --workspace=@lapor-pakdhe/user-service

# Generate Prisma client
RUN npx prisma generate --schema=./packages/prisma-client/prisma/schema.prisma

# Build shared package
RUN npm run build --workspace=@lapor-pakdhe/shared

# Build service
RUN npm run build --workspace=@lapor-pakdhe/user-service

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
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/services/user-service

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start service
CMD ["node", "dist/index.js"]
