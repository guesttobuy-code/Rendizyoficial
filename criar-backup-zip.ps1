# ============================================================================
# SCRIPT: Criar Backup ZIP do Codigo Fonte
# Descricao: Cria um arquivo ZIP com todo o codigo fonte (sem node_modules, etc)
# ============================================================================

Write-Host "Criando backup ZIP do codigo fonte..." -ForegroundColor Cyan
Write-Host ""

# Obter caminho atual
$projectPath = (Get-Location).Path
$projectName = Split-Path -Leaf $projectPath

# Criar nome do arquivo com timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFileName = "Rendizy_Backup_$timestamp.zip"

# Pasta de destino (Downloads do usuario)
$downloadsPath = Join-Path $env:USERPROFILE "Downloads"
$zipFilePath = Join-Path $downloadsPath $zipFileName

Write-Host "Projeto: $projectName" -ForegroundColor Yellow
Write-Host "Destino: $zipFilePath" -ForegroundColor Yellow
Write-Host ""

# Verificar se ja existe arquivo com mesmo nome
if (Test-Path $zipFilePath) {
    Write-Host "Arquivo ja existe. Removendo..." -ForegroundColor Yellow
    Remove-Item $zipFilePath -Force
}

# Criar pasta temporaria para o backup
$tempFolder = Join-Path $env:TEMP "rendizy_backup_$timestamp"
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

Write-Host "Copiando arquivos..." -ForegroundColor Yellow

# Lista de pastas/arquivos para EXCLUIR
$excludePatterns = @(
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    "build",
    "dist",
    ".vite",
    ".supabase",
    ".cache",
    ".parcel-cache",
    "coverage",
    ".next",
    "out",
    ".local",
    ".localhost",
    ".temp",
    ".tmp"
)

# Copiar arquivos excluindo itens
$itemsCopied = 0
Get-ChildItem -Path $projectPath -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($projectPath.Length + 1)
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*\$pattern\*" -or 
            $relativePath -like "$pattern\*" -or 
            $relativePath -eq $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    # Excluir arquivos .log, .DS_Store, Thumbs.db
    if ($_.Name -like "*.log" -or 
        $_.Name -eq ".DS_Store" -or 
        $_.Name -eq "Thumbs.db" -or
        $_.Name -eq "desktop.ini") {
        $shouldExclude = $true
    }
    
    if (-not $shouldExclude) {
        $destPath = Join-Path $tempFolder $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        if (-not $_.PSIsContainer) {
            try {
                Copy-Item $_.FullName -Destination $destPath -Force -ErrorAction Stop
                $itemsCopied++
            } catch {
                # Ignorar erros de arquivos bloqueados
            }
        }
    }
}

Write-Host "Arquivos copiados: $itemsCopied" -ForegroundColor Green

# Criar ZIP
Write-Host ""
Write-Host "Compactando arquivos..." -ForegroundColor Yellow

try {
    # Usar Compress-Archive
    $zipItems = Get-ChildItem -Path $tempFolder -Recurse
    if ($zipItems.Count -gt 0) {
        Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipFilePath -Force -CompressionLevel Optimal
        Write-Host "ZIP criado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Nenhum arquivo para compactar" -ForegroundColor Yellow
        Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host "Erro ao criar ZIP: $_" -ForegroundColor Red
    Write-Host "Tentando metodo alternativo..." -ForegroundColor Yellow
    
    # Metodo alternativo usando .NET
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        if (Test-Path $zipFilePath) {
            Remove-Item $zipFilePath -Force
        }
        [System.IO.Compression.ZipFile]::CreateFromDirectory($tempFolder, $zipFilePath)
        Write-Host "ZIP criado com sucesso (metodo alternativo)!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao criar ZIP: $_" -ForegroundColor Red
        Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

# Limpar pasta temporaria
Write-Host ""
Write-Host "Limpando arquivos temporarios..." -ForegroundColor Yellow
Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue

# Calcular tamanho do arquivo
if (Test-Path $zipFilePath) {
    $zipSize = (Get-Item $zipFilePath).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "BACKUP CRIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Arquivo: $zipFileName" -ForegroundColor Yellow
    Write-Host "Local: $downloadsPath" -ForegroundColor Yellow
    Write-Host "Tamanho: $zipSizeMB MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backup completo do codigo fonte!" -ForegroundColor Green
    Write-Host ""
    
    # Perguntar se deseja abrir a pasta
    $openFolder = Read-Host "Deseja abrir a pasta Downloads? (s/n)"
    if ($openFolder -eq "s" -or $openFolder -eq "S") {
        Start-Process "explorer.exe" -ArgumentList $downloadsPath
    }
} else {
    Write-Host "Erro: Arquivo ZIP nao foi criado" -ForegroundColor Red
    exit 1
}
