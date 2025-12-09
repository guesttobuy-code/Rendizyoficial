# Script para abrir Simple Browser automaticamente
Write-Host "🌐 Aguardando servidor Vite iniciar..." -ForegroundColor Cyan

# Aguardar 3 segundos para servidor subir
Start-Sleep -Seconds 3

# Abrir Simple Browser via VS Code command
Write-Host "🚀 Abrindo Simple Browser em http://localhost:5173" -ForegroundColor Green

# Comando para abrir Simple Browser (funciona se VS Code estiver aberto)
code --open-url "http://localhost:5173" 2>$null

Write-Host "✅ Simple Browser deve estar aberto agora!" -ForegroundColor Green
