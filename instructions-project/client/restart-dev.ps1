# Kill all Node processes and restart dev server cleanly
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Starting dev server..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
npm run dev
