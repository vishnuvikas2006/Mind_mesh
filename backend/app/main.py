from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.config import cors_origins
from app.database.mongo import close_database, get_db, initialise_database
from app.routes import (
    alerts,
    auth,
    emergencies,
    interactions,
    officials,
    support,
    trusted,
    victims,
    voice,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialise_database()
    yield
    close_database()


app = FastAPI(
    title="MindMesh API",
    version="0.1.0",
    description=(
        "Human-reviewed support monitoring prototype. "
        "It does not provide diagnoses or autonomous intervention."
    ),
    lifespan=lifespan,
)


# CORS origins are configured through CORS_ORIGINS. This supports a changing
# Wi-Fi address locally and separate frontend/backend URLs after deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(auth.router)
app.include_router(emergencies.router)
app.include_router(interactions.router)
app.include_router(victims.router)
app.include_router(alerts.router)
app.include_router(officials.router)
app.include_router(support.router)
app.include_router(trusted.router)
app.include_router(voice.router)


@app.get("/health", tags=["System"])
def health():
    try:
        get_db().client.admin.command("ping")
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database is temporarily unavailable.")
    return {
        "status": "ok",
        "service": "mindmesh-api",
    }
