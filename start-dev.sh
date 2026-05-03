#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Starting NEOS Frontend development server..."

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Frontend running at http://localhost:5173"
npm run dev
