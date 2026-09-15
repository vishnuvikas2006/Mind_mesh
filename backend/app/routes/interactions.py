from datetime import UTC, datetime
from uuid import uuid4

from bson import ObjectId
from gridfs import GridFSBucket
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.database.mongo import get_db
from app.schemas import TextInteractionInput
from app.security import current_user, require_victim
from app.serialise import document
from app.services.risk_engine import assess
from app.services.model_inference import analyse_audio_with_model, transcribe_with_whisper

router = APIRouter(prefix="/interactions", tags=["Interactions"])


def voice_note_summary(interaction: dict) -> dict:
    """Metadata only; the recording itself remains behind a separate access check."""
    return {
        "_id": interaction["_id"], "mood": interaction.get("mood"),
        "created_at": interaction.get("created_at"), "audio_available": bool(interaction.get("voice_reference")),
    }


@router.get("/voice/{interaction_id}/audio")
def read_voice_note(interaction_id: str, user: dict = Depends(current_user)):
    """Stream a consented voice note only to its victim or an authorised viewer."""
    db = get_db()
    interaction = db.interactions.find_one({"_id": interaction_id, "channel": "voice", "voice_reference": {"$exists": True}})
    if not interaction:
        raise HTTPException(status_code=404, detail="Voice note not found.")

    allowed = user.get("role") in {"admin", "official"}
    if user.get("role") == "victim":
        allowed = user.get("_id") == interaction.get("user_id")
    elif user.get("role") == "trusted_person":
        allowed = (
            user.get("enabled", True)
            and not user.get("must_change_password")
            and user.get("victim_id") == interaction.get("user_id")
            and "voice_notes" in user.get("permissions", [])
        )
    if not allowed:
        raise HTTPException(status_code=403, detail="You are not authorised to play this voice note.")

    try:
        stream = GridFSBucket(db).open_download_stream(ObjectId(interaction["voice_reference"]))
    except Exception:
        # GridFS errors must not reveal storage details to clients.
        raise HTTPException(status_code=404, detail="Voice note is unavailable.")
    content_type = (stream.metadata or {}).get("content_type", "audio/webm")
    return Response(content=stream.read(), media_type=content_type, headers={"Cache-Control": "no-store", "Content-Disposition": "inline"})


@router.post("/text")
def submit_text_interaction(payload: TextInteractionInput, user: dict = Depends(require_victim)):
    db = get_db()
    return save_analysed_interaction(db, user["_id"], payload.text, payload.mood, payload.channel)


@router.post("/voice")
def submit_voice_interaction(
    audio: UploadFile = File(...),
    transcript: str = Form(default=""),
    mood: str | None = Form(default=None),
    user: dict = Depends(require_victim),
):
    """Store a short consented voice note and analyse an available transcript.

    This MVP stores audio in MongoDB GridFS. It does not claim that an unvalidated
    speech/emotion model can interpret audio; a transcript is therefore required for
    an assistive text signal. The browser can supply one through its speech service.
    """
    allowed_moods = {"okay", "stressed", "scared", "need_help", None, ""}
    if mood not in allowed_moods:
        raise HTTPException(status_code=422, detail="The selected check-in response is invalid.")
    content = audio.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The voice recording was empty. Please record it again.")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Voice notes must be 10 MB or smaller.")
    if audio.content_type and not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="Please upload an audio recording.")

    db = get_db()
    now = datetime.now(UTC)
    audio_id = GridFSBucket(db).upload_from_stream(
        audio.filename or "voice-note.webm",
        content,
        metadata={"user_id": user["_id"], "content_type": audio.content_type or "audio/webm", "created_at": now},
    )
    clean_transcript = transcript.strip()
    transcribed_by_whisper = False
    if not clean_transcript:
        whisper_transcript = transcribe_with_whisper(content, audio.filename)
        if whisper_transcript:
            clean_transcript = whisper_transcript.transcript
            transcribed_by_whisper = True
    voice_signal = analyse_audio_with_model(content, audio.filename)
    interaction = {
        "_id": str(uuid4()), "user_id": user["_id"], "channel": "voice", "mood": mood or None,
        "text": clean_transcript or None, "voice_reference": str(audio_id), "created_at": now,
    }
    db.interactions.insert_one(interaction)
    if not clean_transcript and not voice_signal:
        return {
            "interaction_id": interaction["_id"], "analysis_available": False, "alert_created": False,
            "message": "Your voice note was saved. Add a transcript to enable an assistive text signal while local speech models are unavailable.",
        }

    result = save_analysed_interaction(
        db, user["_id"], clean_transcript, mood or None, "voice", existing_interaction=interaction, voice_signal=voice_signal
    )
    result["analysis_available"] = True
    result["transcribed_by_whisper"] = transcribed_by_whisper
    return result


def save_analysed_interaction(
    db, user_id: str, text: str, mood: str | None, channel: str, existing_interaction: dict | None = None,
    voice_signal=None,
) -> dict:
    created_at = datetime.now(UTC)
    interaction = existing_interaction or {
        "_id": str(uuid4()), "user_id": user_id, "channel": channel,
        "text": text.strip(), "mood": mood, "created_at": created_at,
    }
    if existing_interaction is None:
        db.interactions.insert_one(interaction)
    risk = assess(db, user_id, text.strip(), mood, voice_signal=voice_signal)
    risk["_id"] = str(uuid4())
    db.risk_scores.insert_one(risk | {"user_id": user_id, "interaction_id": interaction["_id"]})
    help_request = None
    if mood == "need_help":
        trusted_count = db.users.count_documents({
            "victim_id": user_id, "role": "trusted_person", "enabled": True,
            "permissions": "help_requests",
        })
        admin_count = db.users.count_documents({"role": {"$in": ["admin", "official"]}, "enabled": {"$ne": False}})
        help_request = {
            "_id": str(uuid4()), "user_id": user_id, "interaction_id": interaction["_id"],
            "status": "pending_human_review", "created_at": created_at,
            "delivery": {"authorised_trusted_people": trusted_count, "authorised_admins": admin_count, "delivery_status": "recorded_for_in_app_review", "external_delivery": "not_configured"},
        }
        db.help_requests.insert_one(help_request)
        db.audit_logs.insert_one({"_id": str(uuid4()), "actor_id": user_id, "event": "help_requested", "help_request_id": help_request["_id"], "created_at": created_at})
    alert = None
    if risk["requires_review"] or mood == "need_help":
        alert = {
            "_id": str(uuid4()), "user_id": user_id, "risk_id": risk["_id"],
            "severity": "high" if mood == "need_help" and risk["risk_level"] in {"low", "moderate"} else risk["risk_level"], "status": "pending_review", "assigned_to": None,
            "created_at": created_at, "reasons": (["The member explicitly requested help."] + risk["reasons"]) if mood == "need_help" else risk["reasons"],
        }
        db.alerts.insert_one(alert)
    return {"interaction_id": interaction["_id"], "risk": document(risk), "alert_created": bool(alert), "alert_id": alert["_id"] if alert else None, "help_request": document(help_request) if help_request else None}
