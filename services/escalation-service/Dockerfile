FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma-client/package*.json ./packages/prisma-client/
COPY services/escalation-service/package*.json ./services/escalation-service/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/prisma-client ./packages/prisma-client
COPY services/escalation-service ./services/escalation-service

# Build packages
RUN npm run build:shared
RUN npm run db:generate
RUN cd services/escalation-service && npm run build

WORKDIR /app/services/escalation-service

EXPOSE 8006

CMD ["npm", "start"]
