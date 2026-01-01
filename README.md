# Lapor Pakdhe

> Sistem Pelaporan Warga Terpadu - Distributed Citizen Reporting System

Aplikasi terdistribusi yang memungkinkan warga melaporkan permasalahan di lingkungannya kepada pihak berwenang.

## Tech Stack

- **Backend:** Node.js 20 LTS, TypeScript, Express.js, Prisma
- **Frontend:** React 18, Vite, Tailwind CSS, React Query
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Message Broker:** RabbitMQ 3.12
- **Object Storage:** MinIO
- **Container:** Docker & Docker Compose

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LAPOR PAKDHE                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)  │  API Gateway  │  WebSocket Server          │
│       :3000        │     :8080     │        :8081                │
├─────────────────────────────────────────────────────────────────┤
│  User Service  │ Report Service │ Notification │ Analytics      │
│     :8001      │     :8002      │    :8003     │   :8004        │
├─────────────────────────────────────────────────────────────────┤
│  Routing Service │ Escalation Service │ External Integration    │
│      :8005       │       :8006        │         :8007           │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │    Redis    │  RabbitMQ   │      MinIO          │
│    :5432     │    :6379    │ :5672/:15672│   :9000/:9001       │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose
- Git

### 1. Clone & Setup

```bash
git clone <repository-url>
cd lapor-pakdhe
cp .env.example .env
```

### 2. Start Infrastructure

```bash
# Start infrastructure services only (for development)
docker-compose -f docker-compose.dev.yml up -d

# Verify all containers are running
docker-compose -f docker-compose.dev.yml ps
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 5. Start Services (Development)

```bash
# In separate terminals, start each service:
npm run dev:gateway
npm run dev:user
npm run dev:report
# ... etc
```

## Project Structure

```
lapor-pakdhe/
├── docker-compose.yml        # Full stack compose
├── docker-compose.dev.yml    # Infrastructure only
├── packages/
│   ├── shared/               # Shared types & utils
│   └── prisma-client/        # Database schema
├── services/
│   ├── api-gateway/          # Request routing
│   ├── user-service/         # Authentication
│   ├── report-service/       # Reports CRUD
│   ├── notification-service/ # Notifications
│   ├── analytics-service/    # Statistics
│   ├── routing-service/      # Auto-routing
│   ├── escalation-service/   # SLA monitoring
│   ├── external-integration/ # External systems
│   └── websocket-server/     # Real-time
└── frontend/                 # React SPA
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| API Gateway | http://localhost:8080 | - |
| WebSocket | http://localhost:8081 | - |
| RabbitMQ Management | http://localhost:15672 | admin / admin |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@lapor.pakdhe | Admin123! | ADMIN |
| warga@example.com | Warga123! | CITIZEN |
| petugas@infra.go.id | Petugas123! | STAFF_L1 |
| kadis@infra.go.id | Kadis123! | STAFF_L2 |
| walikota@pemkot.go.id | Walikota123! | STAFF_L3 |

## Available Scripts

```bash
# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio

# Build
npm run build:packages  # Build shared packages

# Development
npm run dev:gateway     # Start API Gateway
npm run dev:user        # Start User Service
npm run dev:report      # Start Report Service
# ... etc
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Reports
- `GET /api/v1/reports` - List reports
- `POST /api/v1/reports` - Create report
- `GET /api/v1/reports/:id` - Get report detail
- `PATCH /api/v1/reports/:id` - Update report
- `DELETE /api/v1/reports/:id` - Delete report
- `POST /api/v1/reports/:id/upvote` - Toggle upvote

### Staff Actions
- `GET /api/v1/staff/reports` - List department reports
- `PATCH /api/v1/staff/reports/:id/status` - Update status
- `POST /api/v1/staff/reports/:id/assign` - Assign report

### Analytics
- `GET /api/v1/analytics/overview` - Dashboard stats
- `GET /api/v1/analytics/trends` - Report trends
- `GET /api/v1/analytics/performance` - Department performance

## Documentation

See `docs-for-prompting/MASTER_SPEC.md` for complete specification.

## License

MIT
