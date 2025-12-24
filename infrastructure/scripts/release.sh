#!/bin/bash
# Unified release command
set -e

echo "Preparing for production release..."

# 1. Run Tests
npm test

# 2. Build
npm run build

# 3. Version Bump (Optional manual step before release script usually)
# npm run bump-version patch

# 4. Git commands (Example)
# git add .
# git commit -m "chore: release production build"
# git push origin main

echo "Release process initialized. CI/CD will take over upon push."
