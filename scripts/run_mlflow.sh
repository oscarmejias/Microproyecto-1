#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -d ".venv" ]]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
fi

MLFLOW_VERSION="${MLFLOW_VERSION:-3.10.1}"
MLFLOW_HOST="${MLFLOW_HOST:-0.0.0.0}"
MLFLOW_PORT="${MLFLOW_PORT:-8050}"
MLFLOW_ALLOWED_HOSTS="${MLFLOW_ALLOWED_HOSTS:-localhost:8050,50.19.63.113:8050}"
MLFLOW_CORS_ORIGINS="${MLFLOW_CORS_ORIGINS:-http://localhost:3000,http://50.19.63.113:3000}"
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

MLFLOW_CMD="mlflow server -h ${MLFLOW_HOST} -p ${MLFLOW_PORT} --allowed-hosts \"${MLFLOW_ALLOWED_HOSTS}\" --cors-allowed-origins \"${MLFLOW_CORS_ORIGINS}\" --backend-store-uri ${MLFLOW_BACKEND_STORE_URI} --default-artifact-root s3://microproyecto-grupo12/mp-grupo12-mlflow"

echo "Starting MLflow with command:"
echo "  $MLFLOW_CMD"

exec bash -lc "$MLFLOW_CMD"
MLFLOW_CORS_ORIGINS="http://localhost:8050,http://50.19.63.113:8050" \
MLFLOW_ALLOWED_HOSTS="localhost:8050,50.19.63.113:8050" \
bash scripts/run_mlflow.sh