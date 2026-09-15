# MindMesh ML pipeline

The project uses public prototype datasets only. They are intentionally not
committed to Git because they are large and each source has its own licence and
attribution requirements.

## What is included

- `download_datasets.py` fetches the selected Kaggle text and RAVDESS datasets
  into `datasets/raw/` and records their source links in a manifest.
- `train_text.py` fine-tunes a compact **BERT** checkpoint on a balanced text
  subset and saves it to `models/text_bert/`.
- `train_voice.py` freezes **Wav2Vec2**, trains an emotion-classifier head on
  acted RAVDESS speech, and saves it to `models/voice_wav2vec2/`.
- `download_pretrained_models.py` downloads local multilingual **Whisper Tiny**
  weights for transcription. It does not train Whisper because RAVDESS does not
  provide transcription pairs for ASR fine-tuning.
- `train_fusion.py` makes a clearly marked **synthetic integration-only
  XGBoost** fusion artifact. Replace it with consented, paired,
  human-reviewed outcomes before relying on it beyond an MVP demo.

The application records the synthetic XGBoost result as a separate
`fusion_calibration_score` for plumbing verification; the explicit audited
risk rule remains responsible for the displayed risk level and alert creation.

## Run (PowerShell from the repository root)

```powershell
.\.venv\Scripts\python.exe ml\download_datasets.py
.\.venv\Scripts\python.exe ml\train_text.py
.\.venv\Scripts\python.exe ml\train_voice.py
.\.venv\Scripts\python.exe ml\download_pretrained_models.py
.\.venv\Scripts\python.exe ml\train_fusion.py
```

The defaults cap text to 4,000 balanced records and voice to 20 samples per
emotion so CPU training is realistic. Increase only after checking training
time and held-out metrics. Review `models/*/metrics.json` before enabling an
artifact in the application.

## Safety and scope

Dataset category labels and acted emotion are not diagnoses, proof of danger,
identity verification, or validated risk labels. MindMesh uses these artifacts
only as explainable support signals, with human review required for all alerts.
