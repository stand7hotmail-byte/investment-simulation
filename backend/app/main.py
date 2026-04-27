import os
import uuid
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from . import models
from .routers import assets, portfolios, simulation, analytics
from .database import get_engine
from .dependencies import get_db, get_jwks_client
from .log_utils import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = get_engine()
    if engine is not None:
        try:
            models.Base.metadata.create_all(bind=engine)
        except Exception as e:
            logger.warning(f"Database table creation failed on startup: {e}")
    client = get_jwks_client()
    if client:
        try: 
            client.get_signing_keys()
        except Exception: 
            pass
    yield

app = FastAPI(lifespan=lifespan, title="Investment Simulation API", version="1.3.0")

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception(f"Unhandled Exception: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": str(uuid.uuid4())},
        )

# --- MIDDLEWARE ---
logger.info("Setting up robust CORS middleware...")
default_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://investment-sim-frontend.vercel.app"]
allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if allowed_origins_env:
    app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in allowed_origins_env.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
else:
    app.add_middleware(CORSMiddleware, allow_origins=default_origins, allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|investment-sim-frontend.*\.vercel\.app|.*\.up\.railway\.app)(:\d+)?", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- ROUTER INCLUSIONS ---
app.include_router(assets.router)
app.include_router(portfolios.router)
app.include_router(simulation.router)
app.include_router(analytics.router)

@app.get("/")
def read_root(): 
    return {"status": "ok", "message": "Investment Simulation API is running", "ver": "1.3.0"}
