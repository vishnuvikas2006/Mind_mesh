"""Create a versioned XGBoost *integration* fusion model for the MVP.

There is no paired text, voice, behaviour, and human-reviewed risk dataset in
this repository. The generated examples therefore test feature plumbing only;
they are explicitly not clinical training or evidence of model performance.
Replace this script with expert-reviewed, consented paired data before use
beyond a demo.
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ["text_signal", "voice_signal", "behaviour_signal", "previous_score", "trend_signal"]


def main() -> None:
    rng = np.random.default_rng(42)
    rows = 2500
    x = rng.uniform(0, 1, size=(rows, len(FEATURES)))
    # A transparent synthetic calibration target keeps the demo output bounded.
    y = np.clip(100 * (0.57 * x[:, 0] + 0.18 * x[:, 1] + 0.13 * x[:, 2] + 0.07 * x[:, 3] + 0.05 * x[:, 4]), 0, 100)
    model = XGBRegressor(n_estimators=80, max_depth=3, learning_rate=0.05, objective="reg:squarederror", random_state=42)
    model.fit(x, y)
    output_dir = ROOT / "models" / "risk_xgboost"
    output_dir.mkdir(parents=True, exist_ok=True)
    model.save_model(output_dir / "fusion.json")
    metadata = {
        "created_at": datetime.now(UTC).isoformat(), "features": FEATURES, "rows": rows,
        "data_status": "synthetic integration calibration only",
        "limitations": "Not trained on paired human-reviewed real-world outcomes. It is only an MVP plumbing component and must not determine an intervention.",
    }
    (output_dir / "metrics.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved clearly-labelled prototype fusion model to {output_dir}")


if __name__ == "__main__":
    main()
