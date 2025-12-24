#!/bin/bash
# Simple availability health check script

TARGET_URL=${1:-"http://localhost:8080"}

echo "Running health check against $TARGET_URL..."

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $TARGET_URL)

if [ "$STATUS_CODE" -eq 200 ]; then
    echo "SUCCESS: Application is reachable (HTTP 200)"
    exit 0
else
    echo "FAILURE: Application returned $STATUS_CODE"
    exit 1
fi
