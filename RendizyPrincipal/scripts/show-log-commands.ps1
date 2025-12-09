# ============================================================
# COMANDOS ÚTEIS PARA DEBUGGING COM COPILOT
# ============================================================

## 1️⃣ VER LOGS DO NAVEGADOR (últimos 50)
Write-Host "`n📋 LOGS DO NAVEGADOR (últimos 50):" -ForegroundColor Cyan
Write-Host "Cole isso no Console F12 do Simple Browser:" -ForegroundColor Yellow
Write-Host @"

// Ver últimos 50 logs
console.table(window.__RENDIZY_LOGS__.slice(-50))

// Ou copiar para clipboard
copy(JSON.stringify(window.__RENDIZY_LOGS__.slice(-50), null, 2))

"@ -ForegroundColor Green

## 2️⃣ FILTRAR APENAS ERROS
Write-Host "`n❌ VER APENAS ERROS:" -ForegroundColor Red
Write-Host @"

window.__RENDIZY_LOGS__.filter(l => l.level === 'error')

"@ -ForegroundColor Green

## 3️⃣ BUSCAR TEXTO ESPECÍFICO
Write-Host "`n🔍 BUSCAR NOS LOGS:" -ForegroundColor Magenta
Write-Host @"

window.__RENDIZY_LOGS__.filter(l => l.message.includes('BUSCAR_AQUI'))

"@ -ForegroundColor Green

## 4️⃣ LIMPAR LOGS
Write-Host "`n🧹 LIMPAR LOGS:" -ForegroundColor Yellow
Write-Host @"

window.clearRendizyLogs()

"@ -ForegroundColor Green

## 5️⃣ EXPORTAR LOGS PARA ARQUIVO
Write-Host "`n💾 EXPORTAR LOGS:" -ForegroundColor Cyan
Write-Host @"

window.exportRendizyLogs()

"@ -ForegroundColor Green

Write-Host "`n✨ DICA: Copie esses comandos e use no F12!" -ForegroundColor White
Write-Host "📌 Depois de copiar com copy(), cole aqui no chat que eu leio!" -ForegroundColor White
