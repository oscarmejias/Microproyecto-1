#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -d ".venv" ]]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
fi

echo "Installing/updating mlflow..."
python -m pip install --upgrade mlflow

mkdir -p /tmp/mlflow_artifacts

MLFLOW_CMD='mlflow server -h 0.0.0.0 -p 8050 --allowed-hosts "localhost:8050,50.19.63.113:8050" --backend-store-uri sqlite:////tmp/mlflow.db --default-artifact-root file:/tmp/mlflow_artifacts'

echo "Starting MLflow with command:"
echo "  $MLFLOW_CMD"

exec bash -lc "$MLFLOW_CMD"
