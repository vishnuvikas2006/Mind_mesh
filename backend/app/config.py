from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve the backend's own .env file explicitly so configuration works whether
# Uvicorn is started from C:\mindmesh or C:\mindmesh\backend.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@lru_cache
def cors_origins() -> list[str]:
    environment = os.getenv("APP_ENV", "development").strip().lower()
    configured_frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/")
    frontend_origin = configured_frontend_origin or ("" if environment == "production" else "http://localhost:3000")
    raw_cors_origins = os.getenv("CORS_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in raw_cors_origins.split(",") if origin.strip().startswith(("http://", "https://"))]
    if frontend_origin.startswith(("http://", "https://")) and frontend_origin not in origins:
        origins.append(frontend_origin)
    # Public deployments should not silently grant every developer's local
    # browser an origin exception.  Local origins remain convenient in dev.
    local_origins = () if environment == "production" else ("http://localhost:3000", "http://127.0.0.1:3000")
    for local_origin in local_origins:
        if local_origin not in origins:
            origins.append(local_origin)
    return origins


@lru_cache
def settings() -> dict[str, str]:
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").rstrip("/")
    environment = os.getenv("APP_ENV", "development").strip().lower()
    jwt_secret = os.getenv("JWT_SECRET", "mindmesh-development-secret-change-me")
    if environment == "production" and (jwt_secret == "mindmesh-development-secret-change-me" or len(jwt_secret) < 32):
        raise RuntimeError("JWT_SECRET must be a unique value of at least 32 characters in production.")
    if environment == "production" and not os.getenv("FRONTEND_ORIGIN", "").strip():
        raise RuntimeError("FRONTEND_ORIGIN must be set in production.")
    return {
        "environment": environment,
        "mongodb_uri": os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
        "database": os.getenv("MONGODB_DATABASE", "mindmesh"),
        "jwt_secret": jwt_secret,
        "frontend_origin": frontend_origin,
        "password_reset_dev_mode": os.getenv("PASSWORD_RESET_DEV_MODE", "false").lower() == "true",
        "password_reset_ttl_minutes": os.getenv("PASSWORD_RESET_TTL_MINUTES", "30"),
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
        "openai_realtime_model": os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1"),
        "openai_realtime_voice": os.getenv("OPENAI_REALTIME_VOICE", "marin"),
        # Free-tier cloud mode by default. Browser speech APIs provide the
        # voice layer; OpenRouter serves a currently available free text model.
        # Ollama remains an optional fully local alternative.
        "voice_provider": os.getenv("VOICE_PROVIDER", "openrouter").strip().lower(),
        "openrouter_api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "openrouter_base_url": os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/"),
        # A smaller free model makes the default voice turn responsive. The
        # route retries the configured fallbacks for transient free-tier limits.
        "openrouter_model": os.getenv("OPENROUTER_MODEL", "nex-agi/nex-n2.5-mini:free"),
        "openrouter_fallback_models": os.getenv("OPENROUTER_FALLBACK_MODELS", "liquid/lfm-2.5-2.6b:free,inclusionai/ling-3.0-flash-vl:free"),
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/"),
        "ollama_model": os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
    }
