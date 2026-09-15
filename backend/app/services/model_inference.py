"""Optional local ML artifacts for MindMesh support signals.

The API remains available without ML dependencies or artifacts. When the
project virtual environment and locally trained artifacts are present, this
module supplies bounded, explainable signals to the risk engine. These signals
never diagnose a person or make an automated intervention decision.
"""
from __future__ import annotations

import io
import json
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MODEL_ROOT = Path(os.getenv("ML_MODEL_DIR", str(ROOT / "models")))


@dataclass(frozen=True)
class TextModelSignal:
    score: float
    source_label: str
    confidence: float
    requires_prompt_review: bool


@dataclass(frozen=True)
class VoiceModelSignal:
    score: float
    emotion: str
    confidence: float


@dataclass(frozen=True)
class VoiceTranscription:
    """A local Whisper transcript plus its language token, when available."""

    transcript: str
    language: str | None


@dataclass(frozen=True)
class ModelReadiness:
    """Whether an artifact may influence a high-stakes support score."""

    status: str
    macro_f1: float | None
    approved_for_scoring: bool


def ml_available() -> bool:
    return (MODEL_ROOT / "text_bert" / "config.json").exists()


@lru_cache(maxsize=4)
def model_readiness(model_name: str) -> ModelReadiness:
    """Gate local research artifacts before they can affect risk priority.

    A saved checkpoint proves that inference runs; it does *not* prove that it
    is safe for distress monitoring. The threshold is intentionally strict and
    should be replaced with an expert-approved validation protocol before any
    production deployment.
    """
    metrics_path = MODEL_ROOT / model_name / "metrics.json"
    try:
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        macro_f1 = float(metrics.get("validation_macro_f1"))
    except (OSError, TypeError, ValueError, json.JSONDecodeError):
        return ModelReadiness("artifact_unvalidated", None, False)
    # The current source datasets are not domain-valid, so even an F1 that
    # clears this engineering gate still requires governance approval. Keeping
    # the switch false protects against accidental production activation.
    if macro_f1 < 0.75:
        return ModelReadiness("withheld_low_validation_metric", macro_f1, False)
    return ModelReadiness("withheld_pending_domain_validation", macro_f1, False)


@lru_cache(maxsize=1)
def _text_components():
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    model_dir = MODEL_ROOT / "text_bert"
    if not (model_dir / "config.json").exists():
        return None
    tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir, local_files_only=True)
    model.eval()
    return tokenizer, model


def analyse_text_with_model(text: str) -> TextModelSignal | None:
    """Classify a short message only when a local BERT artifact is available."""
    try:
        components = _text_components()
        if components is None or not text.strip():
            return None
        import torch

        tokenizer, model = components
        encoded = tokenizer(text, truncation=True, max_length=128, return_tensors="pt")
        with torch.no_grad():
            probabilities = torch.softmax(model(**encoded).logits, dim=1).squeeze(0).tolist()
        labels = {int(key): str(value).lower() for key, value in model.config.id2label.items()}
        label_index = int(max(range(len(probabilities)), key=probabilities.__getitem__))
        label = labels.get(label_index, "unknown")
        confidence = float(probabilities[label_index])
        risk_weights = {"normal": 0.05, "anxiety": 0.45, "depression": 0.62, "suicidal": 1.0}
        score = sum(float(probability) * risk_weights.get(labels.get(index, ""), 0.5) for index, probability in enumerate(probabilities))
        return TextModelSignal(
            score=round(max(0.0, min(score, 1.0)), 3), source_label=label, confidence=round(confidence, 3),
            requires_prompt_review=label == "suicidal" and confidence >= 0.55,
        )
    except (ImportError, OSError, RuntimeError, ValueError):
        return None


@lru_cache(maxsize=1)
def _fusion_component():
    """Load the MVP XGBoost plumbing artifact if it was trained locally."""
    try:
        from xgboost import XGBRegressor

        path = MODEL_ROOT / "risk_xgboost" / "fusion.json"
        if not path.exists():
            return None
        model = XGBRegressor()
        model.load_model(path)
        return model
    except (ImportError, OSError, ValueError):
        return None


def fusion_calibration_preview(
    text_signal: float, voice_signal: float, behaviour_signal: float, previous_score: int, trend_signal: float,
) -> float | None:
    """Run the local XGBoost artifact without allowing it to decide an alert.

    The current artifact is trained on synthetic data because no paired,
    human-reviewed outcome dataset is available. It is retained as an observable
    integration check until it can be replaced with responsibly collected data.
    """
    try:
        component = _fusion_component()
        if component is None:
            return None
        import numpy as np

        row = np.asarray([[text_signal, voice_signal, behaviour_signal, previous_score / 100, trend_signal]], dtype=float)
        return round(float(component.predict(row)[0]), 1)
    except (ImportError, OSError, RuntimeError, ValueError):
        return None


def _decode_to_waveform(audio_bytes: bytes, suffix: str) -> tuple[object, int] | None:
    """Decode WAV directly and other browser formats through bundled imageio ffmpeg."""
    try:
        import librosa
        import soundfile as sf

        if suffix.lower() in {".wav", ".wave"}:
            samples, sample_rate = sf.read(io.BytesIO(audio_bytes), always_2d=False)
            return samples, int(sample_rate)
        import imageio_ffmpeg

        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / f"note{suffix or '.webm'}"
            destination = Path(temp_dir) / "note.wav"
            source.write_bytes(audio_bytes)
            command = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-i", str(source), "-ar", "16000", "-ac", "1", str(destination)]
            subprocess.run(command, capture_output=True, check=True, timeout=45)
            samples, sample_rate = sf.read(destination, always_2d=False)
            return samples, int(sample_rate)
    except (ImportError, OSError, RuntimeError, ValueError, subprocess.SubprocessError):
        return None


@lru_cache(maxsize=1)
def _voice_components():
    from transformers import AutoFeatureExtractor, Wav2Vec2Model
    import joblib

    model_dir = MODEL_ROOT / "voice_wav2vec2"
    encoder_dir = model_dir / "encoder"
    classifier_path = model_dir / "emotion_classifier.joblib"
    if not (encoder_dir / "config.json").exists() or not classifier_path.exists():
        return None
    extractor = AutoFeatureExtractor.from_pretrained(encoder_dir, local_files_only=True)
    encoder = Wav2Vec2Model.from_pretrained(encoder_dir, local_files_only=True)
    encoder.eval()
    classifier = joblib.load(classifier_path)
    return extractor, encoder, classifier


def analyse_audio_with_model(audio_bytes: bytes, filename: str | None) -> VoiceModelSignal | None:
    """Return an acted-emotion support signal when local Wav2Vec2 artifacts exist."""
    try:
        components = _voice_components()
        if components is None:
            return None
        decoded = _decode_to_waveform(audio_bytes, Path(filename or "").suffix)
        if decoded is None:
            return None
        import librosa
        import numpy as np
        import torch

        waveform, sample_rate = decoded
        waveform = librosa.resample(np.asarray(waveform, dtype=np.float32), orig_sr=sample_rate, target_sr=16000)
        waveform = waveform[: 16000 * 12]
        extractor, encoder, classifier = components
        values = extractor(waveform, sampling_rate=16000, return_tensors="pt", padding=True)
        with torch.no_grad():
            embedding = encoder(values.input_values, attention_mask=values.get("attention_mask")).last_hidden_state.mean(dim=1).cpu().numpy()
        probabilities = classifier.predict_proba(embedding)[0]
        index = int(np.argmax(probabilities))
        emotion = str(classifier.classes_[index])
        confidence = float(probabilities[index])
        signal_weights = {"fearful": 0.82, "sad": 0.62, "angry": 0.58, "disgust": 0.45, "surprised": 0.35, "neutral": 0.16, "calm": 0.10, "happy": 0.08}
        score = sum(float(probability) * signal_weights.get(str(label), 0.35) for label, probability in zip(classifier.classes_, probabilities))
        return VoiceModelSignal(score=round(max(0.0, min(score, 1.0)), 3), emotion=emotion, confidence=round(confidence, 3))
    except (ImportError, OSError, RuntimeError, ValueError, EOFError):
        return None


@lru_cache(maxsize=1)
def _whisper_components():
    from transformers import WhisperForConditionalGeneration, WhisperProcessor

    model_dir = MODEL_ROOT / "whisper_tiny"
    if not (model_dir / "config.json").exists():
        return None
    processor = WhisperProcessor.from_pretrained(model_dir, local_files_only=True)
    model = WhisperForConditionalGeneration.from_pretrained(model_dir, local_files_only=True)
    # The local checkpoint carries a legacy forced task token. The call below
    # explicitly selects transcription while leaving language detection free.
    model.config.forced_decoder_ids = None
    model.generation_config.forced_decoder_ids = None
    model.eval()
    return processor, model


def _whisper_language_from_tokens(processor: object, generated: object) -> str | None:
    """Read Whisper's language token without guessing from Unicode characters.

    Whisper places its detected language in the generated special tokens when
    language is left automatic. Keeping this extraction local means an audio
    turn, not a browser preference, decides the language used downstream.
    """
    try:
        raw = processor.tokenizer.decode(generated[0], skip_special_tokens=False)  # type: ignore[attr-defined,index]
        match = re.search(r"<\|([a-z]{2})\|>", raw)
        return match.group(1) if match else None
    except (AttributeError, IndexError, KeyError, TypeError, ValueError):
        return None


def transcribe_with_whisper(audio_bytes: bytes, filename: str | None) -> VoiceTranscription | None:
    """Transcribe locally with Whisper Tiny and preserve its detected language."""
    try:
        components = _whisper_components()
        decoded = _decode_to_waveform(audio_bytes, Path(filename or "").suffix)
        if components is None or decoded is None:
            return None
        import librosa
        import numpy as np
        import torch

        waveform, sample_rate = decoded
        waveform = librosa.resample(np.asarray(waveform, dtype=np.float32), orig_sr=sample_rate, target_sr=16000)
        processor, model = components
        encoded = processor(waveform, sampling_rate=16000, return_tensors="pt", return_attention_mask=True)
        with torch.no_grad():
            # Preserve the spoken language instead of translating it to English.
            # Whisper's multilingual language token remains automatic.
            generated = model.generate(encoded.input_features, attention_mask=encoded.get("attention_mask"), max_new_tokens=128, task="transcribe")
        transcript = processor.batch_decode(generated, skip_special_tokens=True)[0].strip()
        if not transcript:
            return None
        return VoiceTranscription(transcript=transcript, language=_whisper_language_from_tokens(processor, generated))
    except (ImportError, OSError, RuntimeError, ValueError, subprocess.SubprocessError):
        return None
