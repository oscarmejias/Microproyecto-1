from __future__ import annotations

import csv
import json
import re
import unicodedata
from pathlib import Path
from typing import Dict, Tuple

DEFAULT_CSV = Path("notebooks/diccionario.csv")


def _split_value_line(line: str) -> Tuple[str, str] | None:
    cleaned = line.strip()
    if not cleaned:
        return None
    if "—" in cleaned:
        left, right = cleaned.split("—", 1)
    elif "-" in cleaned:
        left, right = cleaned.split("-", 1)
    else:
        return None
    return left.strip(), right.strip()


def _normalize_field_name(field_name: str) -> str:
    normalized = unicodedata.normalize("NFKD", field_name)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"\s+", "_", normalized)
    normalized = re.sub(r"[^A-Za-z0-9_]", "", normalized)
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized.lower()


def build_category_mapping(csv_path: Path = DEFAULT_CSV) -> Dict[str, Dict[str, int]]:
    mapping: Dict[str, Dict[str, int]] = {}

    with csv_path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        required = {"Término", "Tipo", "Valores"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Missing required columns: {sorted(missing)}")

        for row in reader:
            if row.get("Tipo", "").strip() != "Categorical":
                continue

            term = (row.get("Término") or "").strip()
            if not term:
                continue

            values = row.get("Valores") or ""
            term_map: Dict[str, int] = {}
            for line in values.splitlines():
                parsed = _split_value_line(line)
                if not parsed:
                    continue
                raw_id, label = parsed
                try:
                    value_id = int(raw_id)
                except ValueError:
                    continue
                term_map[label] = value_id

            if term_map:
                mapping[_normalize_field_name(term)] = term_map

    return mapping


def main() -> None:
    mapping = build_category_mapping(DEFAULT_CSV)
    print(json.dumps(mapping, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
