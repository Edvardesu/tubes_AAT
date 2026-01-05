# Lapor Pakdhe

**Sistem Pelaporan Warga Terpadu** - Distributed Citizen Reporting System

Lapor Pakdhe adalah sistem pelaporan warga berbasis microservices yang memungkinkan warga untuk melaporkan masalah di lingkungan mereka, melacak status laporan, dan menerima notifikasi real-time. Sistem ini dirancang untuk mendukung kota dengan populasi ~2.5 juta penduduk.

## Fitur Utama

- **Pelaporan Multi-Tipe**: Publik (dapat di-upvote), Privat, dan Anonim
- **Routing Otomatis**: Laporan otomatis diteruskan ke departemen terkait berdasarkan kategori
- **Eskalasi SLA**: Sistem eskalasi otomatis jika laporan tidak ditangani dalam batas waktu
- **Real-time Notifications**: Notifikasi via WebSocket untuk update status laporan
- **Dashboard Analytics**: Statistik dan visualisasi data untuk monitoring
- **Role-based Access**: Hierarki staff dengan level akses berbeda
- **Media Attachments**: Dukungan upload gambar/file untuk bukti laporan

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                     React + Vite + TypeScript                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (:8080)                         │
│              Rate Limiting, Circuit Breaker, Routing                │
└─────────────────────────────────────────────────────────────────────┘
          │           │           │           │           │
          ▼           ▼           ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │  User   │ │ Report  │ │Notifica-│ │Analytics│ │Escalation│
    │ Service │ │ Service │ │  tion   │ │ Service │ │ Service  │
    │ (:8001) │ │ (:8002) │ │ (:8003) │ │ (:8004) │ │ (:8006)  │
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘
         │           │           │           │           │
         └───────────┴───────────┴─────┬─────┴───────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
       ┌──────────┐            ┌──────────┐            ┌──────────┐
       │PostgreSQL│            │ RabbitMQ │            │  Redis   │
       │ (:5432)  │            │ (:5672)  │            │ (:6379)  │
       └──────────┘            └──────────┘            └──────────┘
```

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API Framework |
| TypeScript | Type Safety |
| Prisma | ORM |
| PostgreSQL | Database |
| Redis | Caching & Sessions |
| RabbitMQ | Message Broker |
| MinIO | Object Storage |
| Socket.io | Real-time Communication |
| JWT | Authentication |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| React Query | Data Fetching |
| React Hook Form | Form Management |
| Recharts | Data Visualization |
| Socket.io Client | Real-time Updates |

## Microservices

| Service | Port | Deskripsi |
|---------|------|-----------|
| API Gateway | 8080 | Entry point, rate limiting, routing |
| User Service | 8001 | Autentikasi & manajemen user |
| Report Service | 8002 | CRUD laporan & media |
| Notification Service | 8003 | Notifikasi in-app & real-time |
| Analytics Service | 8004 | Statistik & trends |
| Routing Service | 8005 | Auto-kategorisasi & routing |
| Escalation Service | 8006 | SLA monitoring & eskalasi |
| External Integration | 8007 | Integrasi sistem eksternal |
| WebSocket Server | 8081 | Real-time WebSocket |

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose
- Git

## Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd tubes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 4. Jalankan Infrastructure Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Ini akan menjalankan:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672, management UI: 15672)
- MinIO (port 9000, console: 9001)

### 5. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed data awal
npm run db:seed
```

### 6. Build Packages

```bash
npm run build:packages
```

## Menjalankan Aplikasi

### Development Mode

Buka terminal terpisah untuk setiap service:

```bash
# Terminal 1 - API Gateway
npm run dev:gateway

# Terminal 2 - User Service
npm run dev:user

# Terminal 3 - Report Service
npm run dev:report

# Terminal 4 - Notification Service
npm run dev:notification

# Terminal 5 - Analytics Service
npm run dev:analytics

# Terminal 6 - WebSocket Server
npm run dev:websocket

# Terminal 7 - Frontend
npm run dev:frontend
```

### Akses Aplikasi

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Akun Default (Setelah Seeding)

### Warga (Citizen)
| Email | Password | Role |
|-------|----------|------|
| warga@example.com | Password123! | CITIZEN |

### Admin
| Email | Password | Role |
|-------|----------|------|
| admin@pemkot.go.id | Admin123! | ADMIN |

### Pejabat Utama (per Bidang)
| Email | Password | Bidang |
|-------|----------|--------|
| utama.keamanan@pemkot.go.id | Staff123! | Keamanan |
| utama.kebersihan@pemkot.go.id | Staff123! | Kebersihan |
| utama.kesehatan@pemkot.go.id | Staff123! | Kesehatan |
| utama.infrastruktur@pemkot.go.id | Staff123! | Infrastruktur |
| utama.sosial@pemkot.go.id | Staff123! | Sosial |

### Pejabat Muda (per Bidang)
| Email | Password | Bidang |
|-------|----------|--------|
| muda1.infrastruktur@pemkot.go.id | Staff123! | Infrastruktur |
| muda2.infrastruktur@pemkot.go.id | Staff123! | Infrastruktur |
| (dan seterusnya untuk bidang lain) | | |

## Struktur Project

```
tubes/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin/Staff pages
│   │   │   ├── citizen/     # Citizen pages
│   │   │   ├── public/      # Public pages
│   │   │   └── shared/      # Shared pages
│   │   ├── services/        # API clients
│   │   ├── stores/          # State management
│   │   └── types/           # TypeScript types
│   └── ...
├── services/                 # Microservices
│   ├── api-gateway/
│   ├── user-service/
│   ├── report-service/
│   ├── notification-service/
│   ├── analytics-service/
│   ├── routing-service/
│   ├── escalation-service/
│   ├── external-integration/
│   └── websocket-server/
├── packages/                 # Shared packages
│   ├── prisma-client/       # Database ORM
│   └── shared/              # Shared utilities
├── infrastructure/           # Infrastructure configs
│   ├── nginx/
│   ├── prometheus/
│   └── grafana/
├── docker-compose.yml        # Production setup
├── docker-compose.dev.yml    # Development setup
└── docs/                     # Documentation
```

## Kategori Laporan

| Kategori | Kode | Departemen Tujuan |
|----------|------|-------------------|
| Keamanan | SECURITY | Dinas Keamanan & Ketertiban |
| Kebersihan | ENVIRONMENT | Dinas Kebersihan & Lingkungan |
| Kesehatan | HEALTH | Dinas Kesehatan |
| Infrastruktur | INFRASTRUCTURE | Dinas Infrastruktur |
| Sosial | SOCIAL | Dinas Sosial |
| Perizinan | PUBLIC_SERVICE | Dinas Perizinan |

## Status Laporan

| Status | Deskripsi |
|--------|-----------|
| PENDING | Baru dibuat |
| RECEIVED | Diterima sistem |
| IN_REVIEW | Sedang ditinjau |
| ASSIGNED | Ditugaskan ke petugas |
| IN_PROGRESS | Sedang dikerjakan |
| RESOLVED | Selesai |
| REJECTED | Ditolak |
| ESCALATED | Dieskalasi ke atasan |
| CLOSED | Ditutup |

## Hierarki Staff

```
ADMIN / CITY_ADMIN
       │
       ▼
DEPARTMENT_HEAD (Kepala Dinas)
       │
       ▼
  STAFF_L2 (Pejabat Utama)
       │
       ▼
  STAFF_L1 (Pejabat Muda)
       │
       ▼
  STAFF_L3 (Staff Lapangan)
```

## Eskalasi SLA

- **Level 1 → Level 2**: 3 hari tanpa penanganan
- **Level 2 → Level 3**: 7 hari tanpa penanganan
- Notifikasi otomatis ke atasan saat eskalasi

## API Documentation

API menggunakan format REST dengan base URL: `http://localhost:8080/api/v1`

### Authentication
```
POST /auth/register    # Registrasi user baru
POST /auth/login       # Login
POST /auth/refresh     # Refresh token
POST /auth/logout      # Logout
```

### Reports
```
GET    /reports/public           # Laporan publik
POST   /reports                  # Buat laporan
GET    /reports/:id              # Detail laporan
PATCH  /reports/:id              # Update laporan
DELETE /reports/:id              # Hapus laporan
POST   /reports/:id/upvote       # Upvote laporan
GET    /reports/track/:refNumber # Lacak laporan
```

### Staff
```
GET    /staff/reports/department  # Laporan departemen
GET    /staff/reports/escalated   # Laporan eskalasi
PATCH  /staff/reports/:id/status  # Update status
POST   /staff/reports/:id/escalate # Eskalasi laporan
```

## Scripts

```bash
# Database
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to DB
npm run db:seed       # Seed initial data
npm run db:reset      # Reset database
npm run db:studio     # Open Prisma Studio

# Build
npm run build:shared  # Build shared package
npm run build:prisma  # Build Prisma client
npm run build:packages # Build all packages

# Development
npm run dev:gateway     # Run API Gateway
npm run dev:user        # Run User Service
npm run dev:report      # Run Report Service
npm run dev:notification # Run Notification Service
npm run dev:analytics   # Run Analytics Service
npm run dev:frontend    # Run Frontend

# Lint & Format
npm run lint          # Run ESLint
npm run format        # Run Prettier
```

## Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang dibutuhkan.

Key variables:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lapor_pakdhe

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## Troubleshooting

### Database connection failed
```bash
# Pastikan PostgreSQL running
docker-compose -f docker-compose.dev.yml ps

# Restart jika perlu
docker-compose -f docker-compose.dev.yml restart postgres
```

### RabbitMQ connection refused
```bash
# Cek status RabbitMQ
docker-compose -f docker-compose.dev.yml logs rabbitmq

# Tunggu sampai ready (biasanya 30-60 detik)
```

### MinIO bucket not found
```bash
# Jalankan init container
docker-compose -f docker-compose.dev.yml up minio-init
```

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## Tim Pengembang

Dikembangkan untuk mata kuliah **IF4031 - Arsitektur Aplikasi Terdistribusi**
Institut Teknologi Bandung
