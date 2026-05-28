@echo off
echo ========================================
echo  Twitch Drops Miner - Production Mode
echo ========================================
echo.

REM Install dependencies if needed
if not exist "frontend\node_modules" (
    echo [1/4] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Build frontend if needed
if not exist "web_static\index.html" (
    echo [2/4] Building frontend...
    cd frontend
    call npm run build
    cd ..
    echo.
)

REM Install Python dependencies
echo [3/4] Checking Python dependencies...
cd backend
pip install -q -r requirements.txt 2>nul
cd ..

REM Start server
echo [4/4] Starting server...
echo.
echo ========================================
echo  Server running at http://localhost:1337
echo ========================================
echo.
cd backend
python server.py --port 1337
