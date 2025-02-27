@echo off
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Checking environment...
call npm run check-env
if errorlevel 1 (
    echo Environment check failed
    pause
    exit /b 1
)

echo Starting Pathotricks Application...
call npm start

if errorlevel 1 (
    echo Error: Failed to start application
    pause
)