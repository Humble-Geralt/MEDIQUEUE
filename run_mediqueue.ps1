# MediQueue One-click Startup Script (PowerShell) - Single Frontend Mode

$ErrorActionPreference = "Stop"

# 1. Config API Key
$envFile = "api/.env"
$exampleFile = "api/.env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "--- First Run Configuration ---" -ForegroundColor Cyan
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
    } else {
        New-Item -ItemType File $envFile | Out-Null
    }
}

$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "DEEPSEEK_API_KEY=sk-") {
    Write-Host "Please enter your DeepSeek API Key (e.g., sk-xxx):" -ForegroundColor Yellow
    $apiKey = Read-Host
    if ($apiKey -like "sk-*") {
        if ($envContent -match "DEEPSEEK_API_KEY=") {
            $envContent = $envContent -replace "DEEPSEEK_API_KEY=.*", "DEEPSEEK_API_KEY=$apiKey"
        } else {
            $envContent += "`nDEEPSEEK_API_KEY=$apiKey"
        }
        $envContent | Set-Content $envFile
        Write-Host "API Key saved to $envFile" -ForegroundColor Green
    } else {
        Write-Host "Warning: Invalid API Key format." -ForegroundColor Red
    }
}

# 2. Dependency Installation
Write-Host "--- Installing Dependencies ---" -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/c uv sync" -WorkingDirectory "api" -NoNewWindow -Wait
Start-Process "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory "web" -NoNewWindow -Wait

# Function to safely kill process tree
function Stop-ProcessTree($pid) {
    if ($pid) {
        Start-Process "taskkill.exe" -ArgumentList "/F /T /PID $pid" -NoNewWindow -Wait -ErrorAction SilentlyContinue
    }
}

Write-Host "--- Starting MediQueue Full Stack ---" -ForegroundColor Cyan

# 3. Start Backend
Write-Host "[1/2] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c uv run uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1" -WorkingDirectory "api" -NoNewWindow -PassThru

# 4. Start Single Frontend (Port 5173)
Write-Host "[2/2] Starting Web Frontend (Port 5173)..." -ForegroundColor Yellow
# Use dev:doctor script as it defaults to port 5173
$frontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev:doctor > frontend.log 2>&1" -WorkingDirectory "web" -NoNewWindow -PassThru

# Wait for readiness
Start-Sleep -Seconds 2

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "MediQueue is now running!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "主力演示链接 (Recommended):" -ForegroundColor White
Write-Host "  > Sandbox: http://127.0.0.1:5173/?view=sandbox" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "独立端链接 (Standalone):" -ForegroundColor White
Write-Host "  > Doctor:  http://127.0.0.1:5173/?view=doctor" -ForegroundColor Gray
Write-Host "  > TV View: http://127.0.0.1:5173/?view=tv" -ForegroundColor Gray
Write-Host "  > Mobile:  http://127.0.0.1:5173/?view=mobile" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Green

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping all services..." -ForegroundColor Red
    Stop-ProcessTree $backendJob.Id
    Stop-ProcessTree $frontendJob.Id
    Write-Host "Cleanup complete." -ForegroundColor Green
}
