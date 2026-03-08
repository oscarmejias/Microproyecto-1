#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -d ".venv" ]]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

require_cmd python
require_cmd dvc
require_cmd docker

WHEEL_PATH="${WHEEL_PATH:-artifacts/wheels/dropout_model_artifact.whl}"
WHEEL_DVC_PATH="${WHEEL_DVC_PATH:-${WHEEL_PATH}.dvc}"
API_WHEEL_DIR="${API_WHEEL_DIR:-api/wheels}"
API_WHEEL_PATH="${API_WHEEL_PATH:-${API_WHEEL_DIR}/dropout_model_artifact.whl}"
IMAGE_NAME="${IMAGE_NAME:-dropout-api:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-dropout-api}"
HOST_PORT="${HOST_PORT:-8001}"
CONTAINER_PORT="${CONTAINER_PORT:-8080}"

echo "[1/6] Pulling wheel artifact from DVC..."
dvc pull "$WHEEL_DVC_PATH"

if [[ ! -f "$WHEEL_PATH" ]]; then
  echo "ERROR: wheel not found at $WHEEL_PATH after dvc pull" >&2
  exit 1
fi

echo "[2/6] Installing wheel locally..."
python -m pip install --upgrade pip
python -m pip install --force-reinstall "$WHEEL_PATH"

echo "[3/6] Syncing wheel into API build context..."
mkdir -p "$API_WHEEL_DIR"
cp "$WHEEL_PATH" "$API_WHEEL_PATH"

echo "[4/6] Building Docker image..."
docker build -t "$IMAGE_NAME" .

echo "[5/6] Restarting container..."
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$IMAGE_NAME"

echo "[6/6] Deployment complete."
echo "Health check URL: http://localhost:${HOST_PORT}/api/v1/health"
