#!/bin/bash
echo "========================================"
echo " Twitch Drops Miner - Production Mode"
echo "========================================"
echo ""

# Install dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[1/4] Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# Build frontend if needed
if [ ! -f "web_static/index.html" ]; then
    echo "[2/4] Building frontend..."
    cd frontend
    npm run build
    cd ..
    echo ""
fi

# Install Python dependencies
echo "[3/4] Checking Python dependencies..."
cd backend
pip install -q -r requirements.txt 2>/dev/null
cd ..

# Start server
echo "[4/4] Starting server..."
echo ""
echo "========================================"
echo " Server running at http://localhost:1337"
echo "========================================"
echo ""
cd backend
python server.py --port 1337
