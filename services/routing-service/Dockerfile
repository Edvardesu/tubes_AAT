FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma-client/package*.json ./packages/prisma-client/
COPY services/routing-service/package*.json ./services/routing-service/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/prisma-client ./packages/prisma-client
COPY services/routing-service ./services/routing-service

# Build packages
RUN npm run build:shared
RUN npm run db:generate
RUN cd services/routing-service && npm run build

WORKDIR /app/services/routing-service

EXPOSE 8005

CMD ["npm", "start"]
