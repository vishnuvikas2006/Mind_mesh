"""Fine-tune a compact BERT checkpoint on the downloaded text dataset.

The output is an assistive language-signal classifier, not a diagnostic model.
Its label names are preserved only to describe the source dataset categories.
"""
from __future__ import annotations

import argparse
import json
import random
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

ROOT = Path(__file__).resolve().parents[1]
LABELS = ["normal", "anxiety", "depression", "suicidal"]
LABEL_TO_ID = {name: index for index, name in enumerate(LABELS)}
TEXT_COLUMNS = ("statement", "text", "content", "message", "sentence")
LABEL_COLUMNS = ("status", "label", "class", "category", "sentiment")


class TextDataset(Dataset):
    def __init__(self, rows: pd.DataFrame, tokenizer, max_length: int):
        self.rows = rows.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, index: int) -> dict[str, torch.Tensor]:
        row = self.rows.iloc[index]
        encoded = self.tokenizer(
            row.text, truncation=True, padding="max_length", max_length=self.max_length, return_tensors="pt"
        )
        return {key: value.squeeze(0) for key, value in encoded.items()} | {"labels": torch.tensor(int(row.label))}


def choose_column(columns: list[str], candidates: tuple[str, ...]) -> str:
    lower = {column.lower().strip(): column for column in columns}
    for candidate in candidates:
        if candidate in lower:
            return lower[candidate]
    raise ValueError(f"Could not find one of {candidates}. Dataset columns were: {columns}")


def load_rows(source_dir: Path, max_samples: int, seed: int) -> pd.DataFrame:
    csv_files = list(source_dir.rglob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV data found beneath {source_dir}. Run ml/download_datasets.py first.")
    candidates: list[pd.DataFrame] = []
    for path in csv_files:
        frame = pd.read_csv(path)
        try:
            text_column = choose_column(list(frame.columns), TEXT_COLUMNS)
            label_column = choose_column(list(frame.columns), LABEL_COLUMNS)
        except ValueError:
            continue
        candidates.append(frame[[text_column, label_column]].rename(columns={text_column: "text", label_column: "label"}))
    if not candidates:
        raise ValueError("No CSV contained both a supported text and source-label column.")
    # Kaggle bundles a small test split alongside two full training files.
    # Selecting the largest compatible CSV prevents accidentally fine-tuning
    # on that test split simply because its filename sorts first.
    selected = max(candidates, key=len)
    selected = selected.dropna()
    selected["text"] = selected["text"].astype(str).str.strip()
    selected["label"] = selected["label"].astype(str).str.strip().str.lower()
    selected = selected[selected["text"].str.len().between(3, 2000) & selected["label"].isin(LABEL_TO_ID)]
    if selected.empty:
        raise ValueError("No supported source labels were found. Expected normal, anxiety, depression, or suicidal.")
    if max_samples:
        portions = []
        per_label = max(1, max_samples // len(LABELS))
        for _, group in selected.groupby("label"):
            portions.append(group.sample(n=min(per_label, len(group)), random_state=seed))
        selected = pd.concat(portions).sample(frac=1, random_state=seed)
    selected["label"] = selected["label"].map(LABEL_TO_ID)
    return selected.reset_index(drop=True)


def evaluate(model, loader: DataLoader, device: torch.device) -> tuple[float, dict]:
    model.eval()
    predictions: list[int] = []
    truth: list[int] = []
    with torch.no_grad():
        for batch in loader:
            labels = batch.pop("labels").to(device)
            logits = model(**{key: value.to(device) for key, value in batch.items()}).logits
            predictions.extend(logits.argmax(dim=1).cpu().tolist())
            truth.extend(labels.cpu().tolist())
    return f1_score(truth, predictions, average="macro", zero_division=0), classification_report(
        truth, predictions, labels=list(range(len(LABELS))), target_names=LABELS, output_dict=True, zero_division=0
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="google/bert_uncased_L-2_H-128_A-2", help="Compact BERT checkpoint for CPU training")
    parser.add_argument("--max-samples", type=int, default=4000, help="Balanced source rows; use 0 for all rows")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--max-length", type=int, default=128)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))

    rows = load_rows(ROOT / "datasets" / "raw" / "mental_health_text", args.max_samples, args.seed)
    train_rows, validation_rows = train_test_split(rows, test_size=0.2, random_state=args.seed, stratify=rows["label"])
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model, num_labels=len(LABELS), id2label={i: label for i, label in enumerate(LABELS)},
        label2id=LABEL_TO_ID, ignore_mismatched_sizes=True,
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    train_loader = DataLoader(TextDataset(train_rows, tokenizer, args.max_length), batch_size=args.batch_size, shuffle=True)
    validation_loader = DataLoader(TextDataset(validation_rows, tokenizer, args.max_length), batch_size=args.batch_size)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0
        for batch in train_loader:
            labels = batch.pop("labels").to(device)
            output = model(**{key: value.to(device) for key, value in batch.items()}, labels=labels)
            output.loss.backward()
            optimizer.step()
            optimizer.zero_grad(set_to_none=True)
            running_loss += float(output.loss.item())
        macro_f1, _ = evaluate(model, validation_loader, device)
        print(f"epoch={epoch + 1} loss={running_loss / max(1, len(train_loader)):.4f} validation_macro_f1={macro_f1:.4f}")

    macro_f1, report = evaluate(model, validation_loader, device)
    output_dir = ROOT / "models" / "text_bert"
    output_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    metrics = {
        "trained_at": datetime.now(UTC).isoformat(), "base_model": args.model, "device": str(device),
        "source_rows": len(rows), "train_rows": len(train_rows), "validation_rows": len(validation_rows),
        "labels": LABELS, "validation_macro_f1": macro_f1, "classification_report": report,
        "limitations": "Source labels are not clinical diagnoses and do not validate this model for victim monitoring or autonomous decisions.",
    }
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved BERT classifier and metrics to {output_dir}")


if __name__ == "__main__":
    main()
