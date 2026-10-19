from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth, farmers, rates, milk, payments, cattle, passbook, assistant, notifications, reports, sms
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="DairySathi - Connected Dairy Cooperative Management and Cattle Care Assistant"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(farmers.router, prefix=settings.API_V1_PREFIX)
app.include_router(rates.router, prefix=settings.API_V1_PREFIX)
app.include_router(milk.router, prefix=settings.API_V1_PREFIX)
app.include_router(payments.router, prefix=settings.API_V1_PREFIX)
app.include_router(cattle.router, prefix=settings.API_V1_PREFIX)
app.include_router(passbook.router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(sms.router, prefix=settings.API_V1_PREFIX) # Last feature module

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DairySathi API",
        "version": settings.PROJECT_VERSION
    }
