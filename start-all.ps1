# 一键启动前端和后端脚本

Write-Host "Starting Frontend and Backend..." -ForegroundColor Green
Write-Host ""

$frontendJob = Start-Job -ScriptBlock {
    cd frontend
    npm run dev
}

$backendJob = Start-Job -ScriptBlock {
    cd backend
    npm run dev
}

Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# 等待并显示输出
try {
    while ($true) {
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue | Write-Host
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue | Write-Host
        Start-Sleep -Milliseconds 100
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Remove-Job -Job $frontendJob -Force
    Remove-Job -Job $backendJob -Force
    Write-Host "All services stopped." -ForegroundColor Green
}
