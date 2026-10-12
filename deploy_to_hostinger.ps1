# ==============================================================================
# Medinex World - One-Click Deployment to Hostinger Live Server
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Medinex World - Deploy to Hostinger" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$AppDir = Join-Path $PSScriptRoot "app-medical\my-app"
Set-Location $AppDir

Write-Host "`n[1/5] Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Next.js build failed!"
    exit 1
}

Write-Host "`n[2/5] Creating lean production archive..." -ForegroundColor Yellow
$ArchivePath = Join-Path $AppDir "dist_build.tar.gz"
if (Test-Path $ArchivePath) { Remove-Item $ArchivePath -Force }
tar.exe --exclude=.next/cache --exclude=.next/dev -czf dist_build.tar.gz .next public
if (-not (Test-Path $ArchivePath)) {
    Write-Error "Failed to create dist_build.tar.gz archive!"
    exit 1
}

Write-Host "`n[3/5] Uploading build files to Hostinger server..." -ForegroundColor Yellow
scp -P 65002 -i "$HOME\.ssh\id_ed25519" -o KexAlgorithms=curve25519-sha256,diffie-hellman-group16-sha512 server.js u291922140@147.93.78.111:/home/u291922140/domains/medinexworld.com/public_html/server.js
scp -P 65002 -i "$HOME\.ssh\id_ed25519" -o KexAlgorithms=curve25519-sha256,diffie-hellman-group16-sha512 .htaccess u291922140@147.93.78.111:/home/u291922140/domains/medinexworld.com/public_html/.htaccess
scp -P 65002 -i "$HOME\.ssh\id_ed25519" -o KexAlgorithms=curve25519-sha256,diffie-hellman-group16-sha512 dist_build.tar.gz u291922140@147.93.78.111:/home/u291922140/domains/medinexworld.com/dist_build.tar.gz

Write-Host "`n[4/5] Extracting build and restarting Phusion Passenger..." -ForegroundColor Yellow
ssh medinex @"
tar -xzf /home/u291922140/domains/medinexworld.com/dist_build.tar.gz -C /home/u291922140/domains/medinexworld.com/public_html/
rm -f /home/u291922140/domains/medinexworld.com/dist_build.tar.gz
mkdir -p /home/u291922140/domains/medinexworld.com/public_html/tmp
touch /home/u291922140/domains/medinexworld.com/public_html/tmp/restart.txt
"@

Remove-Item $ArchivePath -Force -ErrorAction SilentlyContinue

Write-Host "`n[5/5] Verifying live server health..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $resp = Invoke-WebRequest -Uri "https://medinexworld.com/api/settings" -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -eq 200) {
        Write-Host "`n==========================================" -ForegroundColor Green
        Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "  Domain: https://medinexworld.com" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
    }
} catch {
    Write-Host "Site is restarting, check https://medinexworld.com in browser." -ForegroundColor Yellow
}
