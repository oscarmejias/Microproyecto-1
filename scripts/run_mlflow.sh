#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d ".venv" ]]; then
  echo "Creating virtual environment at .venv..."
  python3 -m venv .venv
fi

source ".venv/bin/activate"

MLFLOW_VERSION="${MLFLOW_VERSION:-3.10.1}"
MLFLOW_HOST="${MLFLOW_HOST:-0.0.0.0}"
MLFLOW_PUBLIC_IP="${MLFLOW_PUBLIC_IP:-54.87.51.85}"
MLFLOW_PORT="${MLFLOW_PORT:-8001}"
MLFLOW_ALLOWED_HOSTS="${MLFLOW_ALLOWED_HOSTS:-localhost:${MLFLOW_PORT},${MLFLOW_PUBLIC_IP}:${MLFLOW_PORT}}"
MLFLOW_CORS_ORIGINS="${MLFLOW_CORS_ORIGINS:-http://localhost:${MLFLOW_PORT},http://${MLFLOW_PUBLIC_IP}:${MLFLOW_PORT}}"
MLFLOW_BACKEND_STORE_URI="${MLFLOW_BACKEND_STORE_URI:-sqlite:////tmp/mlflow.db}"
MLFLOW_ARTIFACT_ROOT="${MLFLOW_ARTIFACT_ROOT:-file:/tmp/mlflow_artifacts}"

if ! command -v mlflow >/dev/null 2>&1; then
  echo "Installing mlflow==${MLFLOW_VERSION}..."
  python -m pip install "mlflow==${MLFLOW_VERSION}"
else
  echo "mlflow already installed; keeping current version."
  mlflow --version
fi

mkdir -p /tmp/mlflow_artifacts

MLFLOW_CMD="mlflow server -h ${MLFLOW_HOST} -p ${MLFLOW_PORT} --allowed-hosts \"${MLFLOW_ALLOWED_HOSTS}\" --cors-allowed-origins \"${MLFLOW_CORS_ORIGINS}\" --backend-store-uri ${MLFLOW_BACKEND_STORE_URI} --default-artifact-root ${MLFLOW_ARTIFACT_ROOT}"

echo "Starting MLflow with command:"
echo "  $MLFLOW_CMD"

exec bash -lc "$MLFLOW_CMD"
