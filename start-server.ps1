Write-Host "Starting NXFinance Server..." -ForegroundColor Green
Set-Location -Path "server"
node server.js
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
