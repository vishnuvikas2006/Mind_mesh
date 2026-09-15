"""Download local CPU inference copies of Whisper and Wav2Vec2-compatible assets."""
from __future__ import annotations

from pathlib import Path

from transformers import AutoFeatureExtractor, AutoTokenizer, WhisperForConditionalGeneration, WhisperProcessor

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    whisper_dir = ROOT / "models" / "whisper_tiny"
    whisper_dir.mkdir(parents=True, exist_ok=True)
    print("Downloading multilingual Whisper Tiny for local transcription…")
    processor = WhisperProcessor.from_pretrained("openai/whisper-tiny")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny")
    processor.save_pretrained(whisper_dir)
    model.save_pretrained(whisper_dir)
    print(f"Saved Whisper to {whisper_dir}")


if __name__ == "__main__":
    main()
