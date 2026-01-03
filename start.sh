#!/bin/bash
# Start DevOps Dashboard PWA

echo "==========================================="
echo "🚀 Starting DevOps Dashboard PWA"
echo "==========================================="

# Check if in correct directory
if [ ! -d "app-artifact" ]; then
    echo "❌ ERROR: 'app-artifact' directory not found!"
    echo "Please run this script from the project root."
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found!"
    echo "Please install Python3"
    exit 1
fi

echo "✅ Found Python3: $(python3 --version)"
echo "📂 App directory: $(pwd)/app-artifact"
echo ""

# Check app files
cd app-artifact
REQUIRED_FILES=("index.html" "style.css" "app.js" "manifest.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: $file not found in app-artifact/"
    fi
done
cd ..

echo ""
echo "🌐 Starting server on port 8080..."
echo ""
echo "Open in browser:"
echo "   • http://localhost:8080"
echo "   • http://127.0.0.1:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==========================================="
echo ""
