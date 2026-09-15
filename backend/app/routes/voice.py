"""Authenticated, server-side WebRTC handoff for Sahaaya AI.

The permanent provider API key stays here. Browser audio travels directly over
the negotiated WebRTC transport; this route does not receive, log, or persist
raw audio or transcripts.
"""
from __future__ import annotations

from collections import defaultdict, deque
import hashlib
import json
import re
import time

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import settings
from app.schemas import LocalVoiceTurnInput, RealtimeVoiceSessionInput
from app.security import require_victim
from app.services.model_inference import transcribe_with_whisper

router = APIRouter(prefix="/voice", tags=["Sahaaya AI Voice"])

LANGUAGES = {
    "en": {"name": "English", "locale": "en-IN"},
    "hi": {"name": "Hindi", "locale": "hi-IN"},
    "te": {"name": "Telugu", "locale": "te-IN"},
    "ta": {"name": "Tamil", "locale": "ta-IN"},
    "kn": {"name": "Kannada", "locale": "kn-IN"},
    "ml": {"name": "Malayalam", "locale": "ml-IN"},
    "bn": {"name": "Bengali", "locale": "bn-IN"},
}

# A lightweight single-process guard for a prototype. Deployments should use a
# shared rate-limit store at the gateway so all instances share the same limit.
_recent_starts: defaultdict[str, deque[float]] = defaultdict(deque)
MAX_SESSION_STARTS = 5
WINDOW_SECONDS = 10 * 60


def _rate_limit(user_id: str) -> None:
    now = time.monotonic()
    starts = _recent_starts[user_id]
    while starts and now - starts[0] > WINDOW_SECONDS:
        starts.popleft()
    if len(starts) >= MAX_SESSION_STARTS:
        raise HTTPException(status_code=429, detail="Please wait a few minutes before starting another voice conversation.")
    starts.append(now)


def _instructions(language: str, spiritual_support: str, tradition: str | None) -> str:
    language_instruction = (
        "Listen to the language the user speaks and reply in that same language. "
        "Use the same language for every reply, including ordinary code-switching. "
        "Respect the user's religious and cultural language, terms, and expressions without assuming a faith. "
        "Do not introduce religious content unless the user first requests it. "
        "Support any language the voice service can reliably recognise. "
        "If the language is unclear, ask which language the user prefers."
        if language == "auto"
        else f"Speak in simple, natural {LANGUAGES[language]['name']}."
    )
    spiritual_note = {
        "off": "Do not introduce religious or spiritual content.",
        "reflection": "The user opted into non-religious personal reflection only. Ask permission before offering it.",
        "tradition": f"The user optionally selected {tradition or 'a personal tradition'}. Ask permission before any spiritual content. Never claim religious authority or fabricate scripture.",
    }[spiritual_support]
    return f"""You are Sahaaya AI, a kind, respectful emotional-support voice companion.
{language_instruction} Keep spoken replies concise, calm, and conversational. Listen first; ask one question at a time. Offer choices, not commands.
You support ordinary stress but do not diagnose conditions, claim to be human, promise confidentiality, or replace professional, emergency, legal, or medical services.
Do not ask for unnecessary personal information. Do not say that audio or transcripts are stored.
Wellness suggestions are optional: ask before suggesting breathing, grounding, a break, water, or contacting a trusted person. Stop an activity immediately when asked.
If the user expresses immediate danger, self-harm, suicide, or intent to harm another person: respond compassionately, encourage them to contact local emergency services or a trusted person immediately, encourage them not to stay alone when immediate danger is present, and offer the in-app support/check-in option. Do not minimize, debate, diagnose, or rely only on a wellness activity.
{spiritual_note}"""


def _provider_failure_message(status_code: int, rejected_field: str | None = None) -> str:
    """Return actionable diagnostics without exposing an upstream response body."""
    if status_code == 401:
        return "The voice provider rejected its authentication. Replace the server-side API key and restart the backend."
    if status_code == 403:
        return "This OpenAI project does not currently have permission to start Realtime voice sessions. Check project access and billing."
    if status_code == 429:
        return "The voice provider is rate-limiting this project or its quota is unavailable. Check usage and billing, then try again later."
    if status_code in {400, 404, 422}:
        field_hint = f" Rejected field: {rejected_field}." if rejected_field else ""
        return f"The voice provider rejected the session configuration (HTTP {status_code}). Confirm the configured Realtime model and voice, then restart the backend.{field_hint}"
    if 500 <= status_code <= 599:
        return "The voice provider is temporarily unavailable. Please try again shortly."
    return f"The voice provider could not start this session (HTTP {status_code}). Please try again shortly."


def _safe_rejected_field(response: httpx.Response) -> str | None:
    """Extract an optional provider field name, never its raw error message/body."""
    try:
        value = response.json().get("error", {}).get("param")
    except (ValueError, AttributeError):
        return None
    return value if isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_.-]{1,120}", value) else None


def _ollama_unavailable_message(status_code: int | None = None) -> str:
    if status_code == 404:
        return "The local Qwen model is not downloaded yet. Run: ollama pull qwen2.5:3b"
    return "The free local Qwen service is unavailable. Start Ollama, then run: ollama pull qwen2.5:3b"


def _openrouter_unavailable_message(status_code: int | None = None) -> str:
    if status_code == 401:
        return "The free OpenRouter key was rejected. Create a new key at openrouter.ai/keys and restart the backend."
    if status_code == 429:
        return "The free model rate limit has been reached. Please wait and try again, or select a different free model in backend/.env."
    if status_code == 404:
        return "The configured free OpenRouter model is unavailable. Choose a currently available :free model in backend/.env."
    return "The free OpenRouter voice service is unavailable. Please try again shortly."


def _openrouter_models(config: dict[str, str]) -> tuple[str, ...]:
    """Return distinct configured free models, in failover order.

    Free providers can temporarily rate-limit one model while another remains
    available. This preserves the user's selected primary model and tries only
    explicit, server-side fallbacks; no user content is sent anywhere else.
    """
    configured = [config["openrouter_model"]]
    configured.extend(model.strip() for model in config["openrouter_fallback_models"].split(","))
    return tuple(dict.fromkeys(model for model in configured if model))


@router.post("/transcribe")
async def transcribe_voice_turn(audio: UploadFile = File(...), user: dict = Depends(require_victim)) -> dict[str, str]:
    """Transcribe one audio turn and return Whisper's actual language token."""
    if audio.content_type and not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="Please send an audio recording.")
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="The recorded voice turn was empty. Please try again.")
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="A single voice turn must be 8 MB or smaller.")
    result = transcribe_with_whisper(content, audio.filename)
    if not result:
        raise HTTPException(status_code=503, detail="Local multilingual voice transcription is unavailable. Confirm the Whisper model is installed, then restart the backend.")
    language = result.language if result.language in LANGUAGES else "unknown"
    return {
        "transcript": result.transcript,
        "language": language,
        "language_name": LANGUAGES.get(language, {"name": "Unclear"})["name"],
    }


@router.post("/local-turn")
async def local_qwen_turn(payload: LocalVoiceTurnInput, user: dict = Depends(require_victim)) -> dict[str, str]:
    """Generate one support reply with the configured free-tier text model."""
    config = settings()
    provider = config["voice_provider"]
    if provider not in {"openrouter", "ollama"}:
        raise HTTPException(status_code=500, detail="VOICE_PROVIDER must be either openrouter or ollama.")
    messages = [{"role": "system", "content": _instructions(payload.language, "off", None)}]
    messages.extend({"role": item.role, "content": item.text} for item in payload.history[-8:])
    messages.append({"role": "user", "content": payload.text})
    if provider == "openrouter":
        api_key = config["openrouter_api_key"]
        if not api_key:
            raise HTTPException(status_code=503, detail="Free OpenRouter voice mode is not configured. Add OPENROUTER_API_KEY to backend/.env and restart the backend.")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
                response: httpx.Response | None = None
                for model in _openrouter_models(config):
                    candidate = await client.post(
                        f"{config['openrouter_base_url']}/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}", "HTTP-Referer": config["frontend_origin"], "X-Title": "MindMesh Sahaaya"},
                        json={"model": model, "messages": messages, "temperature": 0.4, "max_tokens": 220},
                    )
                    response = candidate
                    if candidate.status_code < 400:
                        break
                    # Invalid keys and malformed requests cannot be repaired by
                    # selecting another model. Free-tier capacity can.
                    if candidate.status_code not in {404, 429, 500, 502, 503}:
                        break
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail=_openrouter_unavailable_message())
        if response is None:
            raise HTTPException(status_code=503, detail=_openrouter_unavailable_message())
        if response.status_code >= 400:
            raise HTTPException(status_code=503, detail=_openrouter_unavailable_message(response.status_code))
        try:
            reply = str(response.json()["choices"][0]["message"]["content"]).strip()
        except (KeyError, TypeError, ValueError, IndexError):
            raise HTTPException(status_code=502, detail="The free model returned an unexpected reply. Please try again.")
    else:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
                response = await client.post(
                    f"{config['ollama_base_url']}/api/chat",
                    json={"model": config["ollama_model"], "messages": messages, "stream": False},
                )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail=_ollama_unavailable_message())
        if response.status_code >= 400:
            raise HTTPException(status_code=503, detail=_ollama_unavailable_message(response.status_code))
        try:
            reply = str(response.json()["message"]["content"]).strip()
        except (KeyError, TypeError, ValueError):
            raise HTTPException(status_code=502, detail="The local Qwen service returned an unexpected reply. Please try again.")
    if not reply:
        raise HTTPException(status_code=502, detail="The local Qwen service returned an empty reply. Please try again.")
    return {"reply": reply, "language": payload.language}


@router.post("/session")
async def create_voice_session(payload: RealtimeVoiceSessionInput, user: dict = Depends(require_victim)) -> dict[str, str]:
    """Forward a browser SDP offer to the Realtime API without exposing the API key."""
    config = settings()
    if config["voice_provider"] != "openai":
        raise HTTPException(status_code=409, detail="This installation uses the free browser-voice mode instead of OpenAI Realtime.")
    api_key = config["openai_api_key"]
    if not api_key:
        raise HTTPException(status_code=503, detail="Voice conversations are not configured yet. Please ask an administrator to complete setup.")
    _rate_limit(user["_id"])
    session = {
        "type": "realtime",
        "model": config["openai_realtime_model"],
        "instructions": _instructions(payload.language, payload.spiritual_support, payload.spiritual_tradition),
        "audio": {
            "output": {"voice": config["openai_realtime_voice"]},
        },
    }
    form = {
        # These are text fields (not uploaded files). This matches the current
        # official WebRTC example's `FormData.set("sdp", ...)` and
        # `FormData.set("session", ...)` request shape.
        "sdp": (None, payload.sdp),
        "session": (None, json.dumps(session)),
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=10.0)) as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/calls",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "OpenAI-Safety-Identifier": hashlib.sha256(user["_id"].encode()).hexdigest(),
                },
                files=form,
            )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="The voice service is temporarily unavailable. Please try again shortly.")
    if response.status_code >= 400:
        # Do not relay upstream body text: it may expose configuration details.
        raise HTTPException(status_code=502, detail=_provider_failure_message(response.status_code, _safe_rejected_field(response)))
    answer = response.text.strip()
    if not answer.startswith("v="):
        raise HTTPException(status_code=502, detail="The voice service returned an unexpected response. Please try again.")
    return {"sdp": answer}
