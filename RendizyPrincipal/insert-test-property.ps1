# Script para inserir propriedade de teste diretamente no Supabase

$supabaseUrl = "https://odcgnzfremrqnvtitpcc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDQwODAsImV4cCI6MjA0NzYyMDA4MH0.QEGxKPwXCnDkPJxJXKBLv7SLqDsmBBKvv7g-6GrNh9M"

# Gerar ID único
$timestamp = [Math]::Floor([datetime]::UtcNow.Subtract([datetime]"1970-01-01T00:00:00Z").TotalSeconds)
$propertyId = "prop_teste_v3_$timestamp"
$tenantId = "design-user"  # Usar um ID genérico

# Dados da propriedade
$propertyData = @{
    id = $propertyId
    tenant_id = $tenantId
    version = 1
    status = "draft"
    basic_info = @{
        title = "TESTE V3"
        description = "Propriedade de teste criada para validar persistência de dados no Properties V3"
        type = "residential"
    }
    address = @{}
    details = @{}
    pricing = @{}
    gallery = @{ images = @() }
    completed_steps = @(0)
    step_errors = @{}
}

$jsonBody = $propertyData | ConvertTo-Json -Depth 10

Write-Host "📤 Inserindo propriedade de teste..." -ForegroundColor Cyan
Write-Host "   ID: $propertyId" -ForegroundColor Gray
Write-Host "   Título: TESTE V3" -ForegroundColor Gray
Write-Host "   Tenant: $tenantId" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/properties_drafts" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $anonKey
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $jsonBody `
        -ErrorAction Stop

    if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
        Write-Host "✅ Propriedade inserida com sucesso!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Parse resposta
        $result = $response.Content | ConvertFrom-Json
        Write-Host "   Dados retornados:" -ForegroundColor Green
        Write-Host $result | ConvertTo-Json -Depth 3
    } else {
        Write-Host "⚠️ Status inesperado: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao inserir: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Resposta: $responseBody" -ForegroundColor Red
    }
}

# Agora buscar as propriedades
Write-Host "`n🔍 Listando propriedades..." -ForegroundColor Cyan
try {
    $getResponse = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/properties_drafts?tenant_id=eq.$tenantId" `
        -Method GET `
        -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $anonKey"
        } `
        -ErrorAction Stop

    $properties = $getResponse.Content | ConvertFrom-Json
    Write-Host "✅ Encontradas $($properties.Count) propriedade(s)" -ForegroundColor Green
    
    foreach ($prop in $properties) {
        Write-Host "   📍 $($prop.basic_info.title) - Status: $($prop.status)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao listar: $($_.Exception.Message)" -ForegroundColor Red
}
