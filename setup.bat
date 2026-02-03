@echo off
REM ============================================
REM MedChain - Setup dan Run Script
REM ============================================
REM Pastikan Anda menjalankan cmd dari folder: Medchain

echo.
echo ========================================
echo MedChain - Environment Check & Setup
echo ========================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js tidak terinstall!
    echo Download dari: https://nodejs.org/
    exit /b 1
) else (
    echo OK: Node.js terinstall
    node --version
)

echo.

REM Check npm
echo [2/4] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm tidak terinstall!
    exit /b 1
) else (
    echo OK: npm terinstall
    npm --version
)

echo.

REM Check git
echo [3/4] Checking git...
git --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Git tidak terinstall (optional)
) else (
    echo OK: Git terinstall
    git --version
)

echo.

REM Setup Backend
echo [4/4] Installing Backend Dependencies...
cd national-health-record-ledger\off-chain\api-gateway

if not exist node_modules (
    echo Installing npm packages for API Gateway...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install gagal di API Gateway
        exit /b 1
    )
) else (
    echo OK: node_modules sudah ada
)

cd ..\..\..

echo.

REM Setup Frontend
echo [5/5] Installing Frontend Dependencies...
cd legacy_prototype

if not exist node_modules (
    echo Installing npm packages for React app...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install gagal di React app
        exit /b 1
    )
) else (
    echo OK: node_modules sudah ada
)

cd ..

echo.
echo ========================================
echo Setup Complete! ✅
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo Option 1: Run in MOCK mode (no Fabric needed)
echo   1. Run: run-mock.bat
echo   2. Open: http://localhost:5173
echo.
echo Option 2: Run with real Hyperledger Fabric
echo   Read: HYPERLEDGER_FABRIC_SETUP.md
echo   Then: run-real.bat
echo.
echo ========================================
pause
