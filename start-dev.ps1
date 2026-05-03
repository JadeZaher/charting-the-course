Write-Host "Starting NEOS Frontend development server..." -ForegroundColor Cyan

# Install deps if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Frontend running at http://localhost:5173" -ForegroundColor Green
npm run dev
