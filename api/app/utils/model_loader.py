import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
MLMODEL_PATH = MODEL_DIR / "MLmodel"
MODEL_ARTIFACT_PATH = MODEL_DIR / "model.ubj"


def _read_mlmodel_value(key: str, default: str = "local-model") -> str:
    if not MLMODEL_PATH.exists():
        return default

    try:
        lines = MLMODEL_PATH.read_text(encoding="utf-8").splitlines()
    except OSError:
        return default

    for line in lines:
        stripped = line.strip()
        if stripped.startswith(f"{key}:"):
            return stripped.split(":", 1)[1].strip().strip("'\"")
    return default


def get_model_version() -> str:
    # Prioriza model_id del artefacto exportado para trazabilidad.
    return _read_mlmodel_value("model_id", _read_mlmodel_value("run_id", "local-model"))


model_version = get_model_version()


def _ensure_exported_model_files() -> None:
    missing = []
    if not MLMODEL_PATH.exists():
        missing.append(str(MLMODEL_PATH))
    if not MODEL_ARTIFACT_PATH.exists():
        missing.append(str(MODEL_ARTIFACT_PATH))

    if missing:
        raise FileNotFoundError(
            "Missing MLflow exported model files: " + ", ".join(missing)
        )


@lru_cache(maxsize=1)
def _load_model() -> Any:
    _ensure_exported_model_files()
    import mlflow.xgboost

    return mlflow.xgboost.load_model(str(MODEL_DIR))


def make_prediction(input_data: pd.DataFrame) -> Dict[str, Any]:
    try:
        model = _load_model()
        probabilities = model.predict_proba(input_data)
        probabilities = np.asarray(probabilities)

        if probabilities.ndim == 2 and probabilities.shape[1] > 1:
            risk_probs = probabilities[:, 1]
        else:
            risk_probs = probabilities.reshape(-1)

        predictions = [float(x) for x in risk_probs.tolist()]
        return {
            "errors": None,
            "version": model_version,
            "predictions": predictions,
        }
    except Exception as exc:  # pragma: no cover - defensive path
        return {
            "errors": json.dumps({"model": [str(exc)]}),
            "version": model_version,
            "predictions": None,
        }
