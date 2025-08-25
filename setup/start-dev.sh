#!/bin/bash

echo "🚀 Starting Coach Will Gymnastics Development Server"
echo "=================================================="

# Check if we're in Codespaces
if [ -n "$CODESPACES" ]; then
    echo "🌍 Codespace environment detected"
    echo "Frontend will be available at: https://$CODESPACE_NAME-5173.preview.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
    echo "Backend API at: https://$CODESPACE_NAME-5001.preview.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
else
    echo "💻 Local development environment"
    echo "Frontend: http://localhost:5173"
    echo "Backend: http://localhost:5001"
fi

echo ""
echo "🔧 Checking prerequisites..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one based on .env.example"
fi

echo ""
echo "🧹 Gently cleaning up any existing processes..."

# Gentle cleanup
pkill -TERM -f "vite.*5173|tsx.*server" 2>/dev/null || echo "No processes to clean up"
sleep 2

echo ""
echo "🎯 Starting development servers..."

# Start with proper error handling
exec npm run dev
