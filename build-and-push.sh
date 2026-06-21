#!/usr/bin/env bash
# Production build and push for MCQ OCR System.
# Usage: ./build-and-push.sh <dockerhub-username> [image-tag]
# Optional env: BACKEND_URL is baked into the frontend at build time.

set -euo pipefail

if [[ $# -lt 1 || -z "${1:-}" || "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: $0 <dockerhub-username> [image-tag]" >&2
    echo "  dockerhub-username  Required. Registry namespace to push to." >&2
    echo "  image-tag           Optional. Defaults to 'latest'." >&2
    echo "  env BACKEND_URL     Required. Public URL baked into the frontend." >&2
    exit 1
fi

DOCKER_REGISTRY="$1"
IMAGE_TAG="${2:-latest}"
PROJECT_NAME="edumark"
BACKEND_URL="${BACKEND_URL:-}"

if [[ -z "$BACKEND_URL" ]]; then
    echo "Error: BACKEND_URL is not set. Export it or source from .env first." >&2
    echo "  e.g. export \$(grep -v '^#' .env | xargs) && $0 $DOCKER_REGISTRY" >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Error: docker daemon is not reachable." >&2
    exit 1
fi

if ! grep -q "$DOCKER_REGISTRY\|index.docker.io" "${HOME}/.docker/config.json" 2>/dev/null; then
    echo "Error: not logged in to Docker. Run: docker login" >&2
    exit 1
fi

echo "Registry : $DOCKER_REGISTRY"
echo "Tag      : $IMAGE_TAG"
echo "BACKEND  : $BACKEND_URL"
echo ""

build_and_push() {
    local service="$1"
    local dockerfile="$2"
    local context="$3"
    shift 3
    local extra_args=("$@")
    local image="$DOCKER_REGISTRY/$PROJECT_NAME:${service}-${IMAGE_TAG}"

    echo "Building $image"
    docker build --platform linux/amd64 \
        -f "$dockerfile" \
        -t "$image" \
        "${extra_args[@]}" \
        "$context"

    echo "Pushing $image"
    docker push "$image"

    echo "Done: $service"
    echo ""
}

build_and_push "backend"    "fastapi_backend/Dockerfile"     "fastapi_backend"
build_and_push "frontend"   "next_frontend/Dockerfile"       "next_frontend" \
    --build-arg "NEXT_PUBLIC_BACKEND_URL=${BACKEND_URL}"
build_and_push "marking"    "mcq_marking/Dockerfile"         "mcq_marking"
build_and_push "recognizer" "index_recognision/Dockerfile"   "index_recognision"

echo "All images built and pushed:"
echo "  $DOCKER_REGISTRY/$PROJECT_NAME:backend-${IMAGE_TAG}"
echo "  $DOCKER_REGISTRY/$PROJECT_NAME:frontend-${IMAGE_TAG}"
echo "  $DOCKER_REGISTRY/$PROJECT_NAME:marking-${IMAGE_TAG}"
echo "  $DOCKER_REGISTRY/$PROJECT_NAME:recognizer-${IMAGE_TAG}"
echo ""
echo "To deploy on the VM:"
echo "  1. scp docker-compose.yml nginx/ to the VM"
echo "  2. Fill .env and .env.app on the VM (see .env.example, .env.app.example)"
echo "  3. docker compose -f docker-compose.yml pull"
echo "  4. docker compose -f docker-compose.yml up -d"
