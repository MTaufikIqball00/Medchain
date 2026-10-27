<#
.SYNOPSIS
    All-in-One Launcher for MedChain Project (API Gateway + Frontend)
.DESCRIPTION
    Directly checks dependencies, frees conflicting ports, starts services,
    and opens the browser dashboard.
#>

$Host.UI.RawUI.WindowTitle = "MedChain All-in-One Launcher"
Clear-Host

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "             MEDCHAIN - ALL-IN-ONE SYSTEM LAUNCHER              " -ForegroundColor Green
Write-Host "   National Health Record Ledger (API Gateway + Frontend Web UI)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Check Node.js & npm
Write-Host "[1/6] Memeriksa Node.js dan npm..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js tidak ditemukan! Silakan download & install dari https://nodejs.org/" -ForegroundColor Red
    Pause
    Exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm tidak ditemukan!" -ForegroundColor Red
    Pause
    Exit 1
}
Write-Host "      Node.js $(node --version) dan npm $(npm --version) terdeteksi: OK." -ForegroundColor Green
Write-Host ""

# 2. Cleanup ports 3000 & 4000
Write-Host "[2/6] Membersihkan port 3000 dan 4000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Write-Host "      Port 3000 dan 4000 siap digunakan: OK." -ForegroundColor Green
Write-Host ""

# 3. Setup Environment files (.env)
Write-Host "[3/6] Memeriksa file environment..." -ForegroundColor Yellow
$apiEnvPath = Join-Path $rootDir "national-health-record-ledger\off-chain\api-gateway\.env"
if (-not (Test-Path $apiEnvPath)) {
    @"
PORT=4000
BLOCKCHAIN_MODE=MOCK
FABRIC_CHANNEL_NAME=medchannel
FABRIC_CHAINCODE_NAME=medrecords
JWT_SECRET=medchain-secure-jwt-secret-key-2026
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=my_secure_medchain_aes_key_32_bytes_2026
UID_SALT=MEDCHAIN_NATIONAL_PEPPER_SALT_2026
"@ | Set-Content -Path $apiEnvPath -Encoding UTF8
    Write-Host "      .env API Gateway dibuat." -ForegroundColor Cyan
}

$reactEnvPath = Join-Path $rootDir "legacy_prototype\.env.local"
if (-not (Test-Path $reactEnvPath)) {
    @"
VITE_API_URL=http://localhost:4000/api
VITE_ENCRYPTION_PASSPHRASE=MEDCHAIN_CONSORTIUM_SECURE_KEY_2026
VITE_ENCRYPTION_SALT=MEDCHAIN_CONSORTIUM_SALT_2026
"@ | Set-Content -Path $reactEnvPath -Encoding UTF8
    Write-Host "      .env.local Frontend dibuat." -ForegroundColor Cyan
}
Write-Host "      Konfigurasi environment: OK." -ForegroundColor Green
Write-Host ""

# 4. Install Dependencies if missing
Write-Host "[4/6] Memeriksa dependensi (node_modules)..." -ForegroundColor Yellow
$apiNodeModules = Join-Path $rootDir "national-health-record-ledger\off-chain\api-gateway\node_modules"
if (-not (Test-Path $apiNodeModules)) {
    Write-Host "      Menginstall dependensi API Gateway (mohon tunggu)..." -ForegroundColor Yellow
    Push-Location (Join-Path $rootDir "national-health-record-ledger\off-chain\api-gateway")
    npm install --no-audit --no-fund
    Pop-Location
}

$frontendNodeModules = Join-Path $rootDir "legacy_prototype\node_modules"
if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "      Menginstall dependensi Frontend React (mohon tunggu)..." -ForegroundColor Yellow
    Push-Location (Join-Path $rootDir "legacy_prototype")
    npm install --no-audit --no-fund
    Pop-Location
}
Write-Host "      Dependensi modul: OK." -ForegroundColor Green
Write-Host ""

# 5. Launch Services
Write-Host "[5/6] Menjalankan layanan MedChain..." -ForegroundColor Yellow
Write-Host "      - Menjalankan Backend API Gateway di port 4000..." -ForegroundColor Cyan
$apiProcess = Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\national-health-record-ledger\off-chain\api-gateway`" && npm start" -PassThru

Write-Host "      - Menjalankan Frontend React / Vite di port 3000..." -ForegroundColor Cyan
$frontendProcess = Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\legacy_prototype`" && npm run dev" -PassThru
Write-Host ""

# 6. Wait & Open Browser
Write-Host "[6/6] Menghubungkan dan membuka browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "             MEDCHAIN TELAH BERHASIL DIJALANKAN!                 " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  * Frontend Web UI : http://localhost:3000" -ForegroundColor White
Write-Host "  * Backend API     : http://localhost:4000" -ForegroundColor White
Write-Host "  * Health Check    : http://localhost:4000/api/fabric/health" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " KONTROL LAUNCHER:" -ForegroundColor Yellow
Write-Host "   [1] Buka kembali Web Dashboard (Browser)" -ForegroundColor Gray
Write-Host "   [2] Cek Status API Health" -ForegroundColor Gray
Write-Host "   [Q] Hentikan Semua Layanan dan Keluar" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $choice = Read-Host "Pilih opsi [1/2/Q]"
    switch ($choice.ToUpper()) {
        "1" { Start-Process "http://localhost:3000" }
        "2" { Start-Process "http://localhost:4000/api/fabric/health" }
        "Q" {
            Write-Host ""
            Write-Host "Menghentikan seluruh proses MedChain..." -ForegroundColor Yellow
            Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Write-Host "Layanan telah dihentikan dengan aman." -ForegroundColor Green
            Start-Sleep -Seconds 2
            Exit 0
        }
    }
}
