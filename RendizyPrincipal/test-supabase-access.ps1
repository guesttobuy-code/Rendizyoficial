# Script simplificado para testar acesso Supabase

$supabaseUrl = "https://odcgnzfremrqnvtitpcc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDQwODAsImV4cCI6MjA0NzYyMDA4MH0.QEGxKPwXCnDkPJxJXKBLv7SLqDsmBBKvv7g-6GrNh9M"

Write-Host "🔍 Testando acesso básico ao Supabase..." -ForegroundColor Cyan

# Test 1: GET sem autenticação
Write-Host "`n1️⃣ Tentando GET sem headers adicionais:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/properties_drafts?limit=1" `
        -Method GET `
        -Headers @{
            "apikey" = $anonKey
        } `
        -ErrorAction Stop
    Write-Host "✅ GET funcionou! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ GET falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: GET com Authorization header
Write-Host "`n2️⃣ Tentando GET com Authorization Bearer:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/properties_drafts?limit=1" `
        -Method GET `
        -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $anonKey"
        } `
        -ErrorAction Stop
    Write-Host "✅ GET com Bearer funcionou! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ GET com Bearer falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: POST simples
Write-Host "`n3️⃣ Tentando POST com dados mínimos:" -ForegroundColor Yellow
$minimalData = @{
    id = "test_" + [DateTime]::Now.Ticks
    tenant_id = "test"
    version = 1
    status = "draft"
    basic_info = @{}
    address = @{}
    details = @{}
    pricing = @{}
    gallery = @{}
    completed_steps = @()
    step_errors = @{}
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/properties_drafts" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $anonKey
        } `
        -Body $minimalData `
        -ErrorAction Stop
    Write-Host "✅ POST funcionou! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Green
} catch {
    Write-Host "❌ POST falhou" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $streamReader.ReadToEnd()
        Write-Host "   Response Body: $body" -ForegroundColor Red
        $streamReader.Close()
    } catch {
        Write-Host "   (Não conseguiu ler response)" -ForegroundColor Gray
    }
}
