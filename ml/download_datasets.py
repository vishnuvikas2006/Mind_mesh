"""Download the approved public prototype datasets into this repository.

Run from the repository root:
    .\\.venv\\Scripts\\python.exe ml/download_datasets.py

Kaggle may ask for the account to accept a dataset's terms. This script never
prints API credentials. Dataset contents are intentionally git-ignored.
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import kagglehub


class _QuietProgress:
    """Avoid emitting hundreds of terminal progress updates during large downloads."""

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def update(self, *args, **kwargs):
        pass

    def close(self):
        pass


# kagglehub imports tqdm into this module. Replacing only this display object
# leaves download logic intact while keeping an unattended 429 MB transfer alive.
try:
    import kagglehub.clients

    kagglehub.clients.tqdm = _QuietProgress
except (ImportError, AttributeError):
    pass

ROOT = Path(__file__).resolve().parents[1]
DATASETS = {
    "mental_health_text": {
        "handle": "priyangshumukherjee/mental-health-text-classification-dataset",
        "purpose": "BERT-family language-support signal training",
        "source_url": "https://www.kaggle.com/datasets/priyangshumukherjee/mental-health-text-classification-dataset",
        "notes": "Contains public mental-health-related text labels. It is not victim-specific or clinical ground truth.",
    },
    "ravdess_speech": {
        "handle": "uwrfkaggler/ravdess-emotional-speech-audio",
        "purpose": "Wav2Vec2 speech-emotion prototype training",
        "source_url": "https://www.kaggle.com/datasets/uwrfkaggler/ravdess-emotional-speech-audio",
        "notes": "RAVDESS is acted English emotional speech. It must not be used to infer identity, diagnosis, or a real victim's mental health.",
    },
}


def main() -> None:
    destination = ROOT / "datasets" / "raw"
    destination.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "downloaded_at": datetime.now(UTC).isoformat(),
        "datasets": {},
        "usage_notice": "Check each Kaggle dataset page and included files for current licence and attribution requirements before redistribution.",
    }
    for name, metadata in DATASETS.items():
        output_dir = destination / name
        print(f"Downloading {name}…")
        downloaded_path = kagglehub.dataset_download(metadata["handle"], output_dir=str(output_dir))
        manifest["datasets"][name] = metadata | {"local_path": str(Path(downloaded_path).resolve())}
        print(f"Saved {name} to {downloaded_path}")
    manifest_path = destination / "DATASET_MANIFEST.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {manifest_path}")


if __name__ == "__main__":
    main()
