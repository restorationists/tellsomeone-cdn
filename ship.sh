#!/usr/bin/env bash

set -euo pipefail

# Load environment variables from .env file
if [[ -f ".env" ]]; then
    echo "📋 Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "TS_BUNNY_REGION"
    "TS_BUNNY_BUCKET" 
    "TS_BUNNY_BUCKET_TOKEN"
    "TS_BUNNY_PULLZONE_ID"
    "TS_BUNNY_API_KEY"
    "TS_CLOUDFLARE_ZONE"
    "TS_CLOUDFLARE_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "❌ Required environment variable $var is not set!"
        exit 1
    fi
done

# Config
DIST_DIR="dist"

# Timestamp
TIME=$(date +"%H:%M")
DATE=$(date +"%Y-%m-%d")
COMMIT_MSG="Ship dist $TIME at $DATE"

function push_repo() {
    echo "📦 Pushing dist to Git..."
    
    if [[ ! -d "$DIST_DIR" ]]; then
        echo "❌ Distribution directory '$DIST_DIR' does not exist!"
        exit 1
    fi
    
    # Check if this is a git repository
    if [[ ! -d ".git" ]]; then
        echo "❌ '$DIST_DIR' is not a git repository!"
        cd - >/dev/null
        exit 1
    fi
    
    git add .
    git commit -m "$COMMIT_MSG" || echo "⚠️  Nothing to commit."
    git push origin HEAD
    cd - >/dev/null
    echo "✅ Git push complete."
}

function upload_to_cdn() {
    echo "🚀 Uploading dist to BunnyCDN..."
    
    if [[ ! -d "$DIST_DIR" ]]; then
        echo "❌ Distribution directory '$DIST_DIR' does not exist!"
        exit 1
    fi

    # Upload files to BunnyCDN
    find "$DIST_DIR" -type f ! -path "$DIST_DIR/.git/*" ! -name ".git" | while read -r file; do
        relative_path="${file#$DIST_DIR/}"
        remote_url="https://${TS_BUNNY_REGION}.storage.bunnycdn.com/${TS_BUNNY_BUCKET}/${relative_path}"
        echo "🟢 Uploading: $relative_path → $remote_url"

        if ! curl --silent --show-error --fail --request PUT \
            --url "$remote_url" \
            --header "AccessKey: $TS_BUNNY_BUCKET_TOKEN" \
            --header "Content-Type: application/octet-stream" \
            --data-binary @"$file"; then
            echo "❌ Failed to upload: $relative_path"
            exit 1
        fi
    done

    echo "🟢 FLUSHING BUNNY CACHE: https://api.bunny.net/pullzone/${TS_BUNNY_PULLZONE_ID}/purgeCache"

    if ! curl --silent --show-error --fail --request POST \
        --url "https://api.bunny.net/pullzone/${TS_BUNNY_PULLZONE_ID}/purgeCache" \
        --header "AccessKey: $TS_BUNNY_API_KEY" \
        --header "content-type: application/json"; then
        echo "❌ Failed to flush Bunny cache"
        exit 1
    fi

    echo "🟢 FLUSHING CLOUDFLARE CACHE: https://api.cloudflare.com/client/v4/zones/${TS_CLOUDFLARE_ZONE}/purge_cache"
    
    if ! curl --silent --show-error --fail -X POST \
        "https://api.cloudflare.com/client/v4/zones/${TS_CLOUDFLARE_ZONE}/purge_cache" \
        -H 'Content-Type: application/json' \
        -H "X-Auth-Email: acamerondev@protonmail.com" \
        -H "X-Auth-Key: $TS_CLOUDFLARE_API_KEY" \
        -d '{"purge_everything": true}'; then
        echo "❌ Failed to flush Cloudflare cache"
        exit 1
    fi

    echo "✅ CDN upload complete."
}

function usage() {
    echo "Usage: $0 [repo|cdn|both]"
    echo ""
    echo "Commands:"
    echo "  repo  - Only push to git repository"
    echo "  cdn   - Only upload to CDN and flush caches"
    echo "  both  - Push to git and upload to CDN (default)"
    echo ""
    echo "Environment variables required in .env file:"
    for var in "${required_vars[@]}"; do
        echo "  $var"
    done
    exit 1
}

# Main execution
case "${1:-both}" in
    repo) 
        push_repo 
        ;;
    cdn) 
        upload_to_cdn 
        ;;
    both) 
        push_repo && upload_to_cdn 
        ;;
    help|--help|-h)
        usage
        ;;
    *) 
        echo "❌ Invalid argument: $1"
        usage 
        ;;
esac

echo "🎉 Deployment complete!"