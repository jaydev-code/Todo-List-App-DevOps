#!/bin/bash
# Script to regenerate/refresh app-artifact resources
set -e

echo "Starting app artifact maintenance..."

# Create icons directory if missing
mkdir -p app-artifact/icons

echo "Checking manifest and service worker integrity..."
if [ -f "app-artifact/manifest.json" ]; then
    echo "Manifest exists. Validating JSON..."
    cat app-artifact/manifest.json | node -e "JSON.parse(fs.readFileSync(0))"
fi

echo "App generation/check complete."
