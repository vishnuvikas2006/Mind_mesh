"""Train a frozen-Wav2Vec2 speech-emotion classifier from RAVDESS audio.

Only a lightweight classifier head is trained. Wav2Vec2 stays frozen so this
can complete on a CPU. RAVDESS is acted English speech and is not a clinical
or identity-verification model.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import UTC, datetime
from pathlib import Path

import joblib
import librosa
import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from transformers import AutoFeatureExtractor, Wav2Vec2Model

ROOT = Path(__file__).resolve().parents[1]
EMOTIONS = {"01": "neutral", "02": "calm", "03": "happy", "04": "sad", "05": "angry", "06": "fearful", "07": "disgust", "08": "surprised"}
RAVDESS_PATTERN = re.compile(r"03-01-(?P<emotion>0[1-8])-\d{2}-\d{2}-\d{2}-\d{2}\.wav$", re.IGNORECASE)


def source_files(source_dir: Path, max_per_emotion: int) -> list[tuple[Path, str]]:
    grouped: dict[str, list[Path]] = {name: [] for name in EMOTIONS.values()}
    for file in source_dir.rglob("*.wav"):
        match = RAVDESS_PATTERN.search(file.name)
        if match:
            grouped[EMOTIONS[match.group("emotion")]].append(file)
    samples: list[tuple[Path, str]] = []
    for emotion, files in grouped.items():
        for file in sorted(files)[:max_per_emotion]:
            samples.append((file, emotion))
    if not samples:
        raise FileNotFoundError(f"No RAVDESS speech WAV files found beneath {source_dir}. Run ml/download_datasets.py first.")
    return samples


def embedding(path: Path, feature_extractor, model, device: torch.device) -> np.ndarray:
    waveform, _ = librosa.load(path, sr=16000, mono=True, duration=5.0)
    inputs = feature_extractor(waveform, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        states = model(inputs.input_values.to(device), attention_mask=inputs.get("attention_mask", None).to(device) if inputs.get("attention_mask") is not None else None).last_hidden_state
    return states.mean(dim=1).squeeze(0).cpu().numpy()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="facebook/wav2vec2-base")
    parser.add_argument("--max-per-emotion", type=int, default=20, help="CPU-safe balanced sample size")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))
    files = source_files(ROOT / "datasets" / "raw" / "ravdess_speech", args.max_per_emotion)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    feature_extractor = AutoFeatureExtractor.from_pretrained(args.model)
    encoder = Wav2Vec2Model.from_pretrained(args.model).to(device).eval()
    vectors: list[np.ndarray] = []
    labels: list[str] = []
    for index, (path, emotion) in enumerate(files, start=1):
        vectors.append(embedding(path, feature_extractor, encoder, device))
        labels.append(emotion)
        if index % 20 == 0 or index == len(files):
            print(f"Extracted {index}/{len(files)} audio embeddings")
    x = np.vstack(vectors)
    train_x, test_x, train_y, test_y = train_test_split(x, labels, test_size=0.25, random_state=args.seed, stratify=labels)
    classifier = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=args.seed)
    classifier.fit(train_x, train_y)
    predicted = classifier.predict(test_x)
    output_dir = ROOT / "models" / "voice_wav2vec2"
    encoder_dir = output_dir / "encoder"
    output_dir.mkdir(parents=True, exist_ok=True)
    encoder.save_pretrained(encoder_dir)
    feature_extractor.save_pretrained(encoder_dir)
    joblib.dump(classifier, output_dir / "emotion_classifier.joblib")
    metrics = {
        "trained_at": datetime.now(UTC).isoformat(), "base_model": args.model, "device": str(device),
        "source_files": len(files), "max_per_emotion": args.max_per_emotion,
        "classes": list(classifier.classes_), "validation_macro_f1": f1_score(test_y, predicted, average="macro", zero_division=0),
        "classification_report": classification_report(test_y, predicted, output_dict=True, zero_division=0),
        "limitations": "RAVDESS has acted English emotion labels; this model must not make identity, clinical, or automatic escalation decisions.",
    }
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved Wav2Vec2 encoder, classifier, and metrics to {output_dir}")


if __name__ == "__main__":
    main()
