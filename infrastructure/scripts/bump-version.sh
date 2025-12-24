#!/bin/bash
# Usage: ./bump-version.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

echo "Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")

# Update version in app.js or index.html if necessary
sed -i "s/Version: <span id=\"version-tag\">.*<\/span>/Version: <span id=\"version-tag\">$NEW_VERSION<\/span>/g" app-artifact/index.html

echo "Version bumped to $NEW_VERSION"
