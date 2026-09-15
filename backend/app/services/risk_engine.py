"""Explainable prototype risk engine.

This deliberately does not diagnose illness. It turns explicit interaction signals,
recent trends and engagement into a review-priority score for the human-in-the-loop
workflow. Swap ``analyse_text`` for a calibrated domain model after validation.
"""
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
import re

from pymongo.database import Database

from app.services.model_inference import (
    TextModelSignal,
    VoiceModelSignal,
    analyse_text_with_model,
    fusion_calibration_preview,
    model_readiness,
)

# Phrase matching makes prototype decisions explainable and deterministic in a demo.
# Scores are signals, never facts about a person's condition.
HIGH_SIGNAL_PATTERNS = (
    r"\b(?:suicid(?:e|al)|kill myself|end my life|want to die|self[- ]?harm)\b",
    r"\b(?:not safe|in danger|being hurt|hurt me|attack(?:ed)?|threat(?:ened|ening)?)\b",
    r"\b(?:help me now|please help|trapped|cannot go on)\b",
)
MODERATE_SIGNAL_PATTERNS = (
    r"\b(?:scared|afraid|panic|anxious|anxiety|terrified|unsafe|fear)\b",
    r"\b(?:stressed|stress|crying|alone|hopeless|overwhelmed|can't sleep|cannot sleep)\b",
    r"\b(?:harassed|abuse[ds]?|violence|worried)\b",
)
CALM_PATTERNS = (r"\b(?:okay|fine|calm|better|safe|good|well)\b",)


def _matches(text: str, patterns: Iterable[str]) -> list[str]:
    return [pattern for pattern in patterns if re.search(pattern, text, flags=re.IGNORECASE)]


def analyse_text(text: str, mood: str | None) -> tuple[float, list[str], bool]:
    """Return a 0..1 support signal, explanations and immediate-review flag."""
    high = _matches(text, HIGH_SIGNAL_PATTERNS)
    moderate = _matches(text, MODERATE_SIGNAL_PATTERNS)
    calm = _matches(text, CALM_PATTERNS)
    score = 0.10 + min(len(moderate) * 0.18, 0.45) + min(len(high) * 0.38, 0.72)
    mood_adjustment = {"okay": -0.06, "stressed": 0.15, "scared": 0.27, "need_help": 0.42}.get(mood or "", 0)
    score += mood_adjustment
    if calm and not high:
        score -= min(len(calm) * 0.04, 0.08)
    reasons: list[str] = []
    if high:
        reasons.append("Your message contains language that needs prompt human review.")
    elif moderate:
        reasons.append("Your message contains indicators of elevated distress.")
    if mood in {"scared", "need_help"}:
        reasons.append("Your selected check-in response asks for additional support.")
    if not reasons:
        reasons.append("No strong distress language was identified in this check-in.")
    return max(0.02, min(round(score, 3), 0.98)), reasons, bool(high)


def engagement_signal(db: Database, user_id: str, now: datetime) -> tuple[float, list[str]]:
    recent_count = db.interactions.count_documents({"user_id": user_id, "created_at": {"$gte": now - timedelta(days=7)}})
    previous_count = db.interactions.count_documents({"user_id": user_id, "created_at": {"$gte": now - timedelta(days=14), "$lt": now - timedelta(days=7)}})
    if previous_count >= 3 and recent_count == 0:
        return 0.55, ["Recent check-in engagement has changed; a gentle follow-up may help."]
    if previous_count >= 4 and recent_count <= previous_count / 3:
        return 0.35, ["Recent check-in engagement is lower than the previous week."]
    return 0.08, []


def risk_level(score: int) -> str:
    if score >= 81:
        return "critical"
    if score >= 61:
        return "high"
    if score >= 31:
        return "moderate"
    return "low"


def assess(
    db: Database,
    user_id: str,
    text: str,
    mood: str | None,
    voice_signal: VoiceModelSignal | None = None,
) -> dict:
    now = datetime.now(UTC)
    text_score, reasons, immediate_review = analyse_text(text, mood)
    model_signal: TextModelSignal | None = analyse_text_with_model(text)
    text_readiness = model_readiness("text_bert")
    if model_signal and text_readiness.approved_for_scoring:
        # This branch remains disabled until domain validation governance approves
        # an artifact. It is intentionally separate from candidate inference.
        text_score = round(0.55 * text_score + 0.45 * model_signal.score, 3)
        reasons.append(
            "A validated local language-support model contributed a supplementary signal. "
            "A human must interpret it."
        )
        immediate_review = immediate_review or model_signal.requires_prompt_review
    previous = list(db.risk_scores.find({"user_id": user_id}).sort("created_at", -1).limit(3))
    previous_score = previous[0]["dynamic_score"] if previous else 0
    trend = max(0.0, (previous_score - 25) / 100) if previous else 0.0
    engagement, engagement_reasons = engagement_signal(db, user_id, now)
    voice_readiness = model_readiness("voice_wav2vec2")
    voice_score = voice_signal.score if voice_signal else None
    scoring_voice_signal = voice_score if voice_signal and voice_readiness.approved_for_scoring else 0.0
    if voice_signal and voice_readiness.approved_for_scoring:
        reasons.append(
            "A validated local speech-support model contributed a supplementary signal. "
            "This is not identity or clinical evidence."
        )
    # Explicit, bounded fusion for the review workflow. The separately saved
    # XGBoost artifact is integration-only until paired, reviewed outcome data exists.
    voice_component = scoring_voice_signal
    dynamic_score = round(min(100, max(0, 100 * (0.60 * text_score + 0.12 * voice_component + 0.13 * trend + 0.15 * engagement))))
    fusion_preview = fusion_calibration_preview(text_score, voice_component, engagement, previous_score, trend)
    if immediate_review:
        dynamic_score = max(dynamic_score, 82)
    level = risk_level(dynamic_score)
    if not previous:
        trend_label = "new"
    elif dynamic_score >= previous_score + 8:
        trend_label = "rising"
    elif dynamic_score <= previous_score - 8:
        trend_label = "falling"
    else:
        trend_label = "stable"
    if previous and dynamic_score >= previous_score + 12:
        reasons.append("The current support signal is higher than the most recent check-in.")
    reasons.extend(engagement_reasons)
    return {
        "text_score": text_score,
        "voice_score": voice_score,
        "fusion_calibration_score": fusion_preview,
        "model_signals": {
            "text": {
                "candidate_score": model_signal.score if model_signal else None,
                "candidate_category": model_signal.source_label if model_signal else None,
                "candidate_confidence": model_signal.confidence if model_signal else None,
                "readiness": text_readiness.status,
                "validation_macro_f1": text_readiness.macro_f1,
                "used_for_scoring": text_readiness.approved_for_scoring,
            },
            "voice": {
                "candidate_score": voice_score,
                "candidate_emotion": voice_signal.emotion if voice_signal else None,
                "candidate_confidence": voice_signal.confidence if voice_signal else None,
                "readiness": voice_readiness.status,
                "validation_macro_f1": voice_readiness.macro_f1,
                "used_for_scoring": voice_readiness.approved_for_scoring,
            },
            "fusion": {"readiness": "synthetic_integration_preview", "used_for_scoring": False},
        },
        "behaviour_score": round(engagement, 3),
        "previous_score": previous_score or None,
        "score_delta": dynamic_score - previous_score if previous else None,
        "trend": trend_label,
        "interaction_frequency_7d": db.interactions.count_documents({"user_id": user_id, "created_at": {"$gte": now - timedelta(days=7)}}),
        "dynamic_score": dynamic_score,
        "risk_level": level,
        "requires_review": level in {"high", "critical"} or immediate_review,
        "reasons": reasons,
        "created_at": now,
        "engine_version": "risk-gated-prototype-v3",
        "clinical_note": "This is an assistive monitoring signal, not a diagnosis or an automated decision.",
    }
