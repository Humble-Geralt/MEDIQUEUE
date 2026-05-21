# MediQueue One-click Startup Script (PowerShell)

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

Write-Host "--- Starting MediQueue Full Stack ---" -ForegroundColor Cyan

# 2. Start Backend
Write-Host "[1/2] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "uv" -ArgumentList "run uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "api" -NoNewWindow -PassThru

# Wait for backend
Start-Sleep -Seconds 2

# 3. Start Frontends
Write-Host "[2/2] Starting Web Frontends..." -ForegroundColor Yellow

$frontendProcesses = @()

$frontendTasks = @(
    @{ name = "Sandbox"; script = "dev:center"; port = 5176 },
    @{ name = "Doctor"; script = "dev:doctor"; port = 5173 },
    @{ name = "TV Display"; script = "dev:tv"; port = 5174 },
    @{ name = "Mobile App"; script = "dev:mobile"; port = 5175 }
)

foreach ($task in $frontendTasks) {
    Write-Host "  > Launching $($task.name): http://127.0.0.1:$($task.port)" -ForegroundColor Gray
    $p = Start-Process -FilePath "npm" -ArgumentList "run $($task.script)" -WorkingDirectory "web" -NoNewWindow -PassThru
    $frontendProcesses += $p
}

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "MediQueue is now running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Green

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping all services..." -ForegroundColor Red
    $backendJob | Stop-Process -Force -ErrorAction SilentlyContinue
    foreach ($p in $frontendProcesses) {
        $p | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}
