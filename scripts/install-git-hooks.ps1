Param()

Write-Host "Configuring local git hooks path to '.githooks'..."
git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to set git core.hooksPath. Run this script from repository root and ensure git is available." -ForegroundColor Red
    exit 1
}
Write-Host "Hooks configured. To allow pushes temporarily set the env var in your shell:"
Write-Host "  $env:GIT_ALLOW_PUSH = 'true'" -ForegroundColor Cyan
Write-Host "Or create an empty file named '.allow_push' in the repo root to permanently allow pushes."
