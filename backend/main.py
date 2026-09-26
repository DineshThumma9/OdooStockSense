from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import create_db_and_tables
from app.api.auth import router as auth_router, profile_router
from app.api.products import router as products_router
from app.api.warehouses import router as warehouses_router
from app.api.receipts import router as receipts_router
from app.api.deliveries import router as deliveries_router
from app.api.transfers import router as transfers_router
from app.api.adjustments import router as adjustments_router
from app.api.stock import router as stock_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Inventory Management System — StockSense",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI at /docs
    redoc_url="/redoc",     # ReDoc at /redoc
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ── Routes ────────────────────────────────────────────────────────────────────
PREFIX = settings.API_PREFIX

app.include_router(auth_router, prefix=PREFIX)
app.include_router(profile_router, prefix=PREFIX)
app.include_router(products_router, prefix=PREFIX)
app.include_router(warehouses_router, prefix=PREFIX)
app.include_router(receipts_router, prefix=PREFIX)
app.include_router(deliveries_router, prefix=PREFIX)
app.include_router(transfers_router, prefix=PREFIX)
app.include_router(adjustments_router, prefix=PREFIX)
app.include_router(stock_router, prefix=PREFIX)

@app.get("/")
def root():
    return {"app": settings.APP_NAME, "docs": "/docs", "status": "running"}
