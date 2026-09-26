# StockSense IMS

> **A modular, real-time Inventory Management System** built with FastAPI + React — replacing manual registers, Excel sheets, and scattered tracking with a centralized, audit-logged platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11 · FastAPI · SQLModel (SQLAlchemy + Pydantic) |
| **Database** | PostgreSQL 16 (via Docker) |
| **Auth** | JWT (python-jose) · bcrypt passwords · OTP password reset |
| **Real-time** | Server-Sent Events (SSE) — live dashboard KPIs & low-stock alerts |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| **HTTP Client** | Axios with auto-attach JWT + 401 redirect |

---

## Features

### 📦 Product Management
- Create products with Name, SKU, Category, Unit of Measure, Reorder Point
- Initial stock seeding on product creation
- SKU search with debounced filtering and pagination
- Per-location stock availability view

### 📥 Receipts (Incoming Stock)
- Create receipts with supplier + product lines
- Enter expected vs. done quantities
- **Validate** → stock increases, ledger entry written
- Cancel draft receipts

### 📤 Delivery Orders (Outgoing Stock)
- Pick-and-pack flow: draft → validate
- **Validate** → stock decreases automatically
- Full status lifecycle: `draft → waiting → ready → done`

### 🔄 Internal Transfers
- Move stock between any two locations (Rack A → Rack B, WH1 → WH2)
- Total stock unchanged; location updated in real-time
- Every move logged to the stock ledger

### 🛠️ Inventory Adjustments
- Enter physical counted quantities per product
- System auto-computes difference (counted − system)
- **Validate** → stock corrected, adjustment logged with net ± delta

### 📊 Dashboard (Live)
- KPI cards: Total Products · Low/Out-of-Stock · Pending Receipts · Pending Deliveries · Scheduled Transfers
- **SSE live stream** — KPIs update every 5 seconds without page refresh
- Low-stock push notifications via `/notifications/stream`

### 🏭 Warehouses & Locations
- Multi-warehouse support (create warehouses with code + address)
- Nested locations (Input / Internal / Output / Transit types)
- All operations scoped to a specific location

### 🔐 Authentication
- Sign-up / Login with JWT
- OTP-based password reset via Gmail SMTP
- Role-based: `manager` (full access) · `staff` (operations)

---

## Project Structure

```
odoo/
├── docker-compose.yml          # PostgreSQL 16 container
├── backend/
│   ├── .env                    # Environment variables (copy from .env.example)
│   ├── main.py                 # FastAPI app entry point
│   ├── pyproject.toml          # Python dependencies (uv/pip)
│   └── app/
│       ├── api/                # Route handlers (auth, products, receipts…)
│       ├── core/               # DB engine, JWT, config, deps
│       ├── models/             # SQLModel table + schema definitions
│       └── services/           # Business logic (validate, ledger writes…)
└── frontend/
    ├── src/
    │   ├── api/                # Axios API clients (typed)
    │   ├── components/         # Shared UI (shadcn + AuthGuard)
    │   ├── layouts/            # DashboardLayout with sidebar
    │   └── pages/              # Dashboard, Products, Receipts, Deliveries…
    └── vite.config.ts
```

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- Python 3.11+ with [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js 18+

### 1 — Clone & Configure

```bash
git clone <repo-url>
cd odoo
```

Copy the backend env file and fill in your values:
```bash
cp backend/.env.example backend/.env
```

The defaults work out of the box with the Docker container:
```env
DATABASE_URL=postgresql://stocksense:stocksense_pass@localhost:5432/stocksense
SECRET_KEY=change-me-in-production
```

### 2 — Start PostgreSQL

```bash
docker compose up -d
```

The container `stocksense_db` exposes PostgreSQL on `localhost:5432`.  
Data is persisted in the `pgdata` Docker volume.

### 3 — Start Backend

```bash
cd backend

# Install dependencies (first time)
uv sync

# Run the API server
uv run uvicorn main:app --reload --port 8000
```

> On first start, all database tables are created automatically.  
> Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)

### 4 — Start Frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

> App → [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://stocksense:stocksense_pass@localhost:5432/stocksense` | PostgreSQL connection string |
| `SECRET_KEY` | *(set this!)* | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime (24h) |
| `MAIL_USERNAME` | — | Gmail address for OTP emails |
| `MAIL_PASSWORD` | — | Gmail App Password |
| `OTP_EXPIRE_MINUTES` | `10` | OTP validity window |
| `DEBUG` | `True` | SQL query logging |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | Register new user |
| `POST` | `/api/v1/auth/login` | Login → JWT |
| `POST` | `/api/v1/auth/reset/request` | Send OTP to email |
| `POST` | `/api/v1/auth/reset/confirm` | Reset password with OTP |
| `GET` | `/api/v1/dashboard` | KPI snapshot |
| `GET` | `/api/v1/dashboard/stream` | SSE live KPI stream |
| `GET/POST` | `/api/v1/products` | List / create products |
| `GET/POST` | `/api/v1/operations/receipts` | Receipts CRUD |
| `POST` | `/api/v1/operations/receipts/{id}/validate` | Validate receipt |
| `GET/POST` | `/api/v1/operations/deliveries` | Deliveries CRUD |
| `POST` | `/api/v1/operations/deliveries/{id}/validate` | Validate delivery |
| `GET/POST` | `/api/v1/operations/transfers` | Internal transfers CRUD |
| `GET/POST` | `/api/v1/operations/adjustments` | Adjustments CRUD |
| `GET` | `/api/v1/stock/quant` | Current stock per location |
| `GET` | `/api/v1/stock/ledger` | Full movement history |
| `GET/POST` | `/api/v1/warehouses` | Warehouse management |

---

## Stock Ledger Design

The ledger is **append-only** — rows are never updated or deleted.

```
Receipt   → from_location = NULL  (goods arrive from outside)
Delivery  → to_location   = NULL  (goods leave the system)
Transfer  → both locations set    (location change, net zero)
Adjustment → one location NULL    (positive or negative delta)
```

Current stock = `SUM(to_location entries) - SUM(from_location entries)` per product/location.  
`StockQuant` provides an O(1) materialized cache of current stock, updated transactionally on every validate.

---

## Navigation

```
Sidebar
├── Dashboard          Live KPI cards + SSE indicator
├── Products           Catalog with SKU search
├── Operations
│   ├── Receipts       Incoming stock from vendors
│   ├── Deliveries     Outgoing stock to customers
│   ├── Transfers      Location-to-location moves
│   └── Adjustments    Physical count corrections
├── Move History       Stock ledger with type filter
├── Settings           Warehouses & Locations
└── My Profile         Account details
```

---

## License

MIT
