# Script Simples para Mover Pasta Rendizy
$origem = "C:\Users\rafae\Downloads\login-que-funcionou-20251124-172504 BACKUP"
$destino = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"

Write-Host "Movendo de: $origem"
Write-Host "Para: $destino"

# Criar pasta destino se não existir
if (-not (Test-Path $destino)) {
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
    Write-Host "Pasta destino criada"
}

# Mover tudo
if (Test-Path $origem) {
    Write-Host "Iniciando movimentacao..."
    Move-Item -Path "$origem\*" -Destination $destino -Force
    Write-Host "Conteudo movido!"
    
    # Tentar remover pasta vazia
    if ((Get-ChildItem $origem -Force | Measure-Object).Count -eq 0) {
        Remove-Item $origem -Force
        Write-Host "Pasta origem removida"
    }
} else {
    Write-Host "Pasta origem nao encontrada"
}

Write-Host "Concluido!"
