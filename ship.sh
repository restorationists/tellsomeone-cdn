#!/usr/bin/env bash

set -euo pipefail

# Config
BUNNY_REGION=
BUNNY_BUCKET=
BUNNY_BUCKET_TOKEN=
BUNNY_PULLZONE_ID=
BUNNY_API_KEY=
DIST_DIR="dist"

# Timestamp
TIME=$(date +"%H:%M")
DATE=$(date +"%Y-%m-%d")
COMMIT_MSG="Ship dist $TIME at $DATE"

function push_repo() {
  echo "📦 Pushing dist to Git..."
  cd "$DIST_DIR"
  git add .
  git commit -m "$COMMIT_MSG" || echo "⚠️  Nothing to commit."
  git push origin HEAD
  cd - >/dev/null
}

function upload_to_cdn() {
  echo "🚀 Uploading dist to BunnyCDN..."

  find "$DIST_DIR" -type f ! -path "$DIST_DIR/.git/*" ! -name ".git" | while read -r file; do
    relative_path="${file#$DIST_DIR/}"
    remote_url="https://${BUNNY_REGION}.storage.bunnycdn.com/${BUNNY_BUCKET}/${relative_path}"
    echo "🟢 Uploading: $relative_path → $remote_url"

    curl --silent --show-error --fail --request PUT \
      --url "$remote_url" \
      --header "AccessKey: $BUNNY_BUCKET_TOKEN" \
      --header "Content-Type: application/octet-stream" \
      --data-binary @"$file"
  done

  echo "🟢 FLUSHING BUNNY CACHE: https://api.bunny.net/pullzone//purgeCache "

  curl --request POST \
      --url https://api.bunny.net/pullzone/4206471/purgeCache \
      --header 'AccessKey: ' \
      --header 'content-type: application/json'

  echo "🟢 FLUSHING CLOUDFLARE CACHE: https://api.cloudflare.com/client/v4/zones//purge_cache "
  
  curl -X POST https://api.cloudflare.com/client/v4/zones//purge_cache \
      -H 'Content-Type: application/json' \
      -H "X-Auth-Email: acamerondev@protonmail.com" \
      -H "X-Auth-Key: " \
      -d '{"purge_everything": true}'

  echo "✅ CDN upload complete."
}

function usage() {
  echo "Usage: $0 [repo|cdn]"
  echo "If no argument is provided, both will run."
  exit 1
}

# Main
case "${1:-both}" in
  repo) push_repo ;;
  cdn) upload_to_cdn ;;
  both) push_repo && upload_to_cdn ;;
  *) usage ;;
esac