@echo off
title राजभाषा पोर्टल लॉन्चर
echo ==========================================
echo    RAJBHASHA PORTAL - DESKTOP MODE
echo ==========================================
echo.

set PORT=8000

:: Kill any existing process on this port to prevent conflicts
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT%') do taskkill /f /pid %%a >nul 2>&1

:: Attempt to start server using Python or Node
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Python detected. Starting background server on port %PORT%...
    start /b python -m http.server %PORT% >nul 2>&1
) else (
    node -v >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Node.js detected. Starting background server on port %PORT%...
        start /b npx serve -s . -l %PORT% >nul 2>&1
    ) else (
        echo [ERROR] Python or Node.js is required to run locally.
        echo Please install from python.org or nodejs.org
        pause
        exit
    )
)

:: Wait for server to initialize
timeout /t 2 >nul

:: Try to launch in App Mode (Standalone Window) for a native feel
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist %CHROME_PATH% (
    echo [INFO] Launching in Chrome App Mode...
    start "" %CHROME_PATH% --app=http://localhost:%PORT%
) else if exist %EDGE_PATH% (
    echo [INFO] Launching in Edge App Mode...
    start "" %EDGE_PATH% --app=http://localhost:%PORT%
) else (
    echo [INFO] Launching in default browser...
    start http://localhost:%PORT%
)

echo.
echo [SUCCESS] App is running. Do not close this window while using the app.
