# MediQueue 一键启动脚本 (PowerShell 版)

$ErrorActionPreference = "Stop"

# 1. 检查并引导配置 API Key
$envFile = "api/.env"
$exampleFile = "api/.env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "--- 首次运行配置 ---" -ForegroundColor Cyan
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
    } else {
        New-Item -ItemType File $envFile | Out-Null
    }
}

$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "DEEPSEEK_API_KEY=sk-") {
    Write-Host "请输入您的 DeepSeek API Key (例如 sk-xxx):" -ForegroundColor Yellow
    $apiKey = Read-Host
    if ($apiKey -like "sk-*") {
        if ($envContent -match "DEEPSEEK_API_KEY=") {
            $envContent = $envContent -replace "DEEPSEEK_API_KEY=.*", "DEEPSEEK_API_KEY=$apiKey"
        } else {
            $envContent += "`nDEEPSEEK_API_KEY=$apiKey"
        }
        $envContent | Set-Content $envFile
        Write-Host "API Key 已保存至 $envFile" -ForegroundColor Green
    } else {
        Write-Host "警告: 无效的 API Key 格式。程序将尝试继续运行，但 AI 评估功能可能失效。" -ForegroundColor Red
    }
}

Write-Host "--- 正在启动 MediQueue 全栈服务 ---" -ForegroundColor Cyan

# 2. 启动后端
Write-Host "[1/2] 正在启动 FastAPI 后端 (端口 8000)..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "uv" -ArgumentList "run uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "api" -NoNewWindow -PassThru

# 等待后端就绪
Start-Sleep -Seconds 2

# 3. 启动前端群
Write-Host "[2/2] 正在启动 Web 前端服务群..." -ForegroundColor Yellow

$frontendProcesses = @()

$frontendTasks = @(
    @{ name = "联动中心 (Sandbox)"; script = "dev:center"; port = 5176 },
    @{ name = "医生诊室"; script = "dev:doctor"; port = 5173 },
    @{ name = "候诊大屏"; script = "dev:tv"; port = 5174 },
    @{ name = "患者移动端"; script = "dev:mobile"; port = 5175 }
)

foreach ($task in $frontendTasks) {
    Write-Host "  > 正在启动 $($task.name): http://127.0.0.1:$($task.port)" -ForegroundColor Gray
    $p = Start-Process -FilePath "npm" -ArgumentList "run $($task.script)" -WorkingDirectory "web" -NoNewWindow -PassThru
    $frontendProcesses += $p
}

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "MediQueue 已全线启动！" -ForegroundColor Green
Write-Host "请访问上述 URL 进行演示。" -ForegroundColor White
Write-Host "按 Ctrl+C 或直接关闭此窗口以停止所有服务" -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Green

# 保持窗口打开并等待
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "正在停止所有服务..." -ForegroundColor Red
    $backendJob | Stop-Process -Force -ErrorAction SilentlyContinue
    foreach ($p in $frontendProcesses) {
        $p | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}
