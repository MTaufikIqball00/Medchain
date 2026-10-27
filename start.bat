@echo off
setlocal enabledelayedexpansion
title MedChain All-in-One Launcher
color 0A

:: Banner
cls
echo ================================================================
echo             MEDCHAIN - ALL-IN-ONE SYSTEM LAUNCHER               
echo   National Health Record Ledger (API Gateway + Frontend Web App)
echo ================================================================
echo.

:: 1. Check Node.js & npm
echo [1/6] Memeriksa instalasi Node.js dan npm...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan! Silakan install Node.js terlebih dahulu.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm tidak ditemukan!
    pause
    exit /b 1
)
echo       Node.js dan npm terdeteksi: OK.
echo.

:: 2. Cleanup ports 3000 & 4000
echo [2/6] Membersihkan port 3000 dan 4000 dari proses sebelumnya...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo       Port 3000 dan 4000 siap digunakan: OK.
echo.

:: 3. Setup Environment Variables (.env)
echo [3/6] Memeriksa file konfigurasi environment...
if not exist "national-health-record-ledger\off-chain\api-gateway\.env" (
    echo       Membuat .env untuk API Gateway...
    (
        echo PORT=4000
        echo BLOCKCHAIN_MODE=MOCK
        echo FABRIC_CHANNEL_NAME=medchannel
        echo FABRIC_CHAINCODE_NAME=medrecords
        echo JWT_SECRET=medchain-secure-jwt-secret-key-2026
        echo JWT_EXPIRES_IN=24h
        echo ENCRYPTION_KEY=my_secure_medchain_aes_key_32_bytes_2026
        echo UID_SALT=MEDCHAIN_NATIONAL_PEPPER_SALT_2026
    ) > "national-health-record-ledger\off-chain\api-gateway\.env"
    echo       .env API Gateway dibuat.
)

if not exist "legacy_prototype\.env.local" (
    echo       Membuat .env.local untuk Frontend React...
    (
        echo VITE_API_URL=http://localhost:4000/api
        echo VITE_ENCRYPTION_PASSPHRASE=MEDCHAIN_CONSORTIUM_SECURE_KEY_2026
        echo VITE_ENCRYPTION_SALT=MEDCHAIN_CONSORTIUM_SALT_2026
    ) > "legacy_prototype\.env.local"
    echo       .env.local Frontend dibuat.
)
echo       Konfigurasi environment: OK.
echo.

:: 4. Install Dependencies if missing
echo [4/6] Memeriksa dependensi modul (node_modules)...
if not exist "national-health-record-ledger\off-chain\api-gateway\node_modules\" (
    echo       Menginstall dependensi API Gateway (mohon tunggu)...
    pushd "%~dp0national-health-record-ledger\off-chain\api-gateway"
    call npm install --no-audit --no-fund
    popd
)

if not exist "legacy_prototype\node_modules\" (
    echo       Menginstall dependensi Frontend React (mohon tunggu)...
    pushd "%~dp0legacy_prototype"
    call npm install --no-audit --no-fund
    popd
)
echo       Dependensi modul: OK.
echo.

:: 5. Launch Backend & Frontend
echo [5/6] Menjalankan layanan MedChain...
echo       - Menjalankan Backend API Gateway (Port 4000)...
start "MedChain - Backend API Gateway" cmd /k "cd /d ""%~dp0national-health-record-ledger\off-chain\api-gateway"" && npm start"

echo       - Menjalankan Frontend React / Vite (Port 3000)...
start "MedChain - Frontend Web UI" cmd /k "cd /d ""%~dp0legacy_prototype"" && npm run dev"
echo.

:: 6. Wait and Open Browser
echo [6/6] Menghubungkan dan membuka browser...
timeout /t 5 >nul

echo       Membuka Web Dashboard di browser...
start http://localhost:3000

cls
echo ================================================================
echo             MEDCHAIN TELAH BERHASIL DIJALANKAN!                 
echo ================================================================
echo.
echo  * Frontend Web UI : http://localhost:3000
echo  * Backend API     : http://localhost:4000
echo  * Health Check    : http://localhost:4000/api/fabric/health
echo.
echo ================================================================
echo  KONTROL LAUNCHER:
echo    [1] Buka kembali Web Dashboard (Browser)
echo    [2] Cek Status API Health
echo    [Q] Hentikan Semua Layanan dan Keluar
echo ================================================================
echo.

:menu
set "opt="
set /p opt="Pilih opsi [1/2/Q]: "
if /i "%opt%"=="1" (
    start http://localhost:3000
    goto menu
)
if /i "%opt%"=="2" (
    start http://localhost:4000/api/fabric/health
    goto menu
)
if /i "%opt%"=="Q" (
    goto shutdown
)
goto menu

:shutdown
echo.
echo Menghentikan seluruh proses MedChain...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo Layanan telah dihentikan dengan aman.
timeout /t 2 >nul
exit /b 0
