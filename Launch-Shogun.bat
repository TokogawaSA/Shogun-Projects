@echo off
title Shogun Projects App Launcher
cd /d "%~dp0"

echo [1/3] Starting Shogun Projects Backend...
start /min cmd /c "cd /d \"%~dp0server\" && node dist/server.js"

echo [2/3] Starting Shogun Projects Frontend...
start /min cmd /c "node scripts/serve-dist.js"

echo [3/3] Opening App Window...
timeout /t 2 /nobreak >nul
start msedge --app=http://localhost:5173
exit
