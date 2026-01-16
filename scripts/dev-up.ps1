$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
    Copy-Item "docker/environment/.env.local" ".env"
}

docker compose up -d --build

$frontendDir = Join-Path $root "frontend"
if (Test-Path $frontendDir) {
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendDir -WindowStyle Minimized
}
