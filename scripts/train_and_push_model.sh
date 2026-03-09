#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d ".venv" ]]; then
  echo "Creating virtual environment at .venv..."
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source ".venv/bin/activate"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

require_cmd python

echo "[1/10] Installing packaging requirements from pyproject.toml..."
python -m pip install --upgrade pip
python - <<'PY'
import pathlib
import subprocess
import sys
import tomllib

pyproject = pathlib.Path("pyproject.toml")
if not pyproject.exists():
    raise SystemExit("ERROR: pyproject.toml not found")

data = tomllib.loads(pyproject.read_text(encoding="utf-8"))
requirements = data.get("build-system", {}).get("requires", [])
if not requirements:
    raise SystemExit("ERROR: build-system.requires is empty in pyproject.toml")

subprocess.check_call(
    [sys.executable, "-m", "pip", "install", "--upgrade", *requirements]
)
PY

echo "[2/10] Installing runtime requirements from requirements.txt..."
if [[ ! -f "requirements.txt" ]]; then
  echo "ERROR: requirements.txt not found" >&2
  exit 1
fi
python -m pip install -r requirements.txt

if ! command -v dvc >/dev/null 2>&1; then
  echo "dvc not found. Installing dvc[s3]..."
  python -m pip install "dvc[s3]"
fi

require_cmd dvc

echo "[3/10] Pulling tracked data/artifacts with DVC..."
if [[ "${SKIP_DVC_PULL:-0}" == "1" ]]; then
  echo "SKIP_DVC_PULL=1 -> skipping dvc pull"
else
  if ! dvc pull; then
    echo "WARNING: dvc pull failed. Continuing with local workspace state." >&2
    echo "Hint: set SKIP_DVC_PULL=1 to skip this step explicitly." >&2
  fi
fi

echo "[4/10] Training models..."
python -m src.train

echo "[5/10] Exporting best model to prod_model/modelo_final/..."
python -m src.export_model

if [[ ! -f "prod_model/modelo_final/MLmodel" ]]; then
  echo "ERROR: prod_model/modelo_final is incomplete. Expected MLmodel" >&2
  exit 1
fi

WHEEL_VERSION="${WHEEL_VERSION:-0.1.$(date +%Y%m%d%H%M%S)}"
WHEEL_PACKAGE_NAME="dropout_model_artifact"
WHEEL_OUT_DIR="artifacts/wheels/dist"
WHEEL_STABLE_FILENAME="${WHEEL_PACKAGE_NAME}-0.0.0-py3-none-any.whl"
WHEEL_STABLE_PATH="artifacts/wheels/${WHEEL_STABLE_FILENAME}"
WHEEL_DVC_PATH="${WHEEL_STABLE_PATH}.dvc"
WHEEL_MODEL_DIR="${WHEEL_PACKAGE_NAME}/model"
WHEEL_INIT_FILE="${WHEEL_PACKAGE_NAME}/__init__.py"

echo "[6/10] Preparing wheel source tree..."
rm -rf "$WHEEL_MODEL_DIR"
mkdir -p "$WHEEL_MODEL_DIR" "$WHEEL_OUT_DIR"
cp -R prod_model/modelo_final/. "$WHEEL_MODEL_DIR/"
cat > "$WHEEL_INIT_FILE" <<'PY'
from importlib.resources import files


def get_model_dir() -> str:
    return str(files("dropout_model_artifact").joinpath("model"))
PY

if [[ ! -f "${WHEEL_MODEL_DIR}/MLmodel" ]]; then
  echo "ERROR: wheel model folder missing MLmodel at ${WHEEL_MODEL_DIR}/MLmodel" >&2
  exit 1
fi
if [[ ! -f "${WHEEL_MODEL_DIR}/model.pkl" ]] && [[ ! -f "${WHEEL_MODEL_DIR}/model.ubj" ]]; then
  echo "ERROR: wheel model folder missing model.pkl or model.ubj at ${WHEEL_MODEL_DIR}" >&2
  exit 1
fi

echo "[7/10] Building wheel..."
WHEEL_VERSION="$WHEEL_VERSION" python -m build --wheel --outdir "$WHEEL_OUT_DIR" .

BUILT_WHEEL="$(python - <<'PY'
import pathlib
dist = pathlib.Path("artifacts/wheels/dist")
candidates = sorted(dist.glob("dropout_model_artifact-*.whl"), key=lambda p: p.stat().st_mtime, reverse=True)
if not candidates:
    raise SystemExit(1)
print(candidates[0])
PY
)"

cp "$BUILT_WHEEL" "$WHEEL_STABLE_PATH"
echo "Built wheel: $BUILT_WHEEL"
echo "Stable wheel: $WHEEL_STABLE_PATH"

echo "[8/10] Verifying wheel import and model files..."
python -m pip install --force-reinstall "$BUILT_WHEEL"
python - <<'PY'
import os
from dropout_model_artifact import get_model_dir

model_dir = get_model_dir()
has_mlmodel = os.path.exists(os.path.join(model_dir, "MLmodel"))
has_model_bin = os.path.exists(os.path.join(model_dir, "model.pkl")) or os.path.exists(os.path.join(model_dir, "model.ubj"))
if not has_mlmodel or not has_model_bin:
    raise SystemExit(
        f"Wheel validation failed. model_dir={model_dir}, has_mlmodel={has_mlmodel}, has_model_bin={has_model_bin}"
    )
print(f"Wheel validation OK. model_dir={model_dir}")
PY

echo "[9/10] Versioning with DVC..."
dvc add prod_model
dvc add "$WHEEL_STABLE_PATH"

echo "[10/11] Pushing DVC artifacts to remote..."
dvc push

echo "[11/11] Done."
echo "Tracked artifacts:"
echo " - prod_model (prod_model.dvc)"
echo " - wheel ($WHEEL_DVC_PATH)"
dvc status -c || true
