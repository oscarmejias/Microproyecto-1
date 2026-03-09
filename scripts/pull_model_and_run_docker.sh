#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

require_cmd docker

ECR_IMAGE_URI="${ECR_IMAGE_URI:-043088044587.dkr.ecr.us-east-1.amazonaws.com/students-dropout:latest}"
AWS_REGION="${AWS_REGION:-us-east-1}"
CONTAINER_NAME="${CONTAINER_NAME:-dropout-api}"
HOST_PORT="${HOST_PORT:-8050}"
CONTAINER_PORT="${CONTAINER_PORT:-8080}"

if [[ -z "$ECR_IMAGE_URI" ]]; then
  echo "ERROR: ECR_IMAGE_URI is required." >&2
  echo "Example: ECR_IMAGE_URI=043088044587.dkr.ecr.us-east-1.amazonaws.com/students-dropout:latest bash scripts/pull_model_and_run_docker.sh" >&2
  exit 1
fi

if command -v aws >/dev/null 2>&1; then
  echo "[1/4] Logging into ECR..."
  ECR_REGISTRY="$(echo "$ECR_IMAGE_URI" | cut -d/ -f1)"
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
else
  echo "[1/4] aws CLI not found, skipping ECR login (assuming already authenticated)."
fi

echo "[2/4] Pulling image from ECR..."
docker pull "$ECR_IMAGE_URI"

echo "[3/4] Restarting container..."
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$ECR_IMAGE_URI"

echo "[4/4] Deployment complete."
echo "Health check URL: http://localhost:${HOST_PORT}/api/v1/health"
