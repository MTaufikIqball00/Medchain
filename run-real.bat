@echo off
REM ============================================
REM MedChain - Run with Real Hyperledger Fabric
REM ============================================

echo.
echo ========================================
echo MedChain - Running with Real Fabric
echo ========================================
echo.
echo PREREQUISITES - Must be completed FIRST:
echo.
echo 1. Download and install Hyperledger Fabric
echo    - Follow: HYPERLEDGER_FABRIC_SETUP.md
echo    - Run Fabric test-network
echo    - Deploy chaincode
echo.
echo 2. Verify Fabric is running:
echo    docker ps
echo.
echo 3. Enroll user with Fabric CA
echo.
echo ========================================
echo.

REM Create .env file for API Gateway
if not exist "national-health-record-ledger\off-chain\api-gateway\.env" (
    echo Creating .env for API Gateway...
    (
        echo BLOCKCHAIN_MODE=REAL
        echo FABRIC_CHANNEL_NAME=medchannel
        echo FABRIC_CHAINCODE_NAME=medrecords
        echo FABRIC_CONNECTION_PROFILE_PATH=./connection-org1.json
        echo FABRIC_WALLET_PATH=./wallet
        echo PORT=4000
    ) > "national-health-record-ledger\off-chain\api-gateway\.env"
    echo .env created with BLOCKCHAIN_MODE=REAL
    echo.
)

REM Create .env.local file for React if not exists
if not exist "legacy_prototype\.env.local" (
    echo Creating .env.local for React...
    (
        echo VITE_API_URL=http://localhost:4000/api
    ) > "legacy_prototype\.env.local"
    echo .env.local created
    echo.
)

echo.
echo Checking prerequisites...
echo.

REM Check Docker
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not running!
    echo Please start Docker and Fabric network first
    echo Run: cd national-health-record-ledger/fabric-samples/test-network
    echo Then: ./network.sh up createChannel -c medchannel
    exit /b 1
) else (
    echo OK: Docker is running
)

echo.

REM Check if Fabric peer is running
docker ps | findstr "peer0.org1" >nul
if errorlevel 1 (
    echo ERROR: Fabric peer not running!
    echo Please start the Fabric network first
    exit /b 1
) else (
    echo OK: Fabric peer is running
)

echo.
echo ========================================
echo Starting Backend API (REAL Fabric mode)...
echo ========================================
cd national-health-record-ledger\off-chain\api-gateway
start "MedChain API Gateway (REAL)" cmd /k "npm start"
timeout /t 3

echo.
echo ========================================
echo Starting Frontend...
echo ========================================
cd ..\..\..\legacy_prototype
start "MedChain Frontend" cmd /k "npm run dev"

echo.
echo Wait 10 seconds for services to start...
echo.
timeout /t 10

echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo MedChain is Running with Real Fabric! ✅
echo ========================================
echo.
echo Backend API: http://localhost:4000
echo Frontend: http://localhost:5173
echo Fabric Network: Running locally
echo.
echo Test endpoints:
echo - GET http://localhost:4000/api/fabric/health
echo - GET http://localhost:4000/api/fabric/records
echo.
pause
