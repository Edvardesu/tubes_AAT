FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma-client/package*.json ./packages/prisma-client/
COPY services/notification-service/package*.json ./services/notification-service/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/prisma-client ./packages/prisma-client
COPY services/notification-service ./services/notification-service

# Build packages
RUN npm run build:shared
RUN npm run db:generate
RUN cd services/notification-service && npm run build

WORKDIR /app/services/notification-service

EXPOSE 8003

CMD ["npm", "start"]
