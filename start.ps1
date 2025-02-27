Write-Host "Checking Node.js installation..."
try {
    node --version | Out-Null
} catch {
    Write-Host "Error: Node.js is not installed!"
    Write-Host "Please install Node.js from https://nodejs.org/"
    pause
    exit 1
}

Write-Host "Installing dependencies..."
npm install

Write-Host "Checking environment..."
npm run check-env
if ($LASTEXITCODE -ne 0) {
    Write-Host "Environment check failed"
    pause
    exit 1
}

Write-Host "Starting Pathotricks Application..."
npm start

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start application"
    pause
} 