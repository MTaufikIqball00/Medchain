@echo off
REM ============================================
REM MedChain - Run in MOCK Mode
REM (No Fabric needed - for testing)
REM ============================================

echo.
echo ========================================
echo MedChain - Running in MOCK Mode
echo ========================================
echo.
echo This will start:
echo  - Backend API on http://localhost:4000
echo  - Frontend on http://localhost:5173
echo.
echo Press Ctrl+C in any terminal to stop
echo.
echo ========================================
echo.

REM Create .env file for API Gateway if not exists
if not exist "national-health-record-ledger\off-chain\api-gateway\.env" (
    echo Creating .env for API Gateway...
    (
        echo BLOCKCHAIN_MODE=MOCK
        echo FABRIC_CHANNEL_NAME=medchannel
        echo FABRIC_CHAINCODE_NAME=medrecords
        echo PORT=4000
    ) > "national-health-record-ledger\off-chain\api-gateway\.env"
    echo .env created: BLOCKCHAIN_MODE=MOCK
    echo.
)

REM Create .env.local file for React if not exists
if not exist "legacy_prototype\.env.local" (
    echo Creating .env.local for React...
    (
        echo VITE_API_URL=http://localhost:4000/api
    ) > "legacy_prototype\.env.local"
    echo .env.local created: VITE_API_URL=http://localhost:4000/api
    echo.
)

echo.
echo Starting Backend API...
cd national-health-record-ledger\off-chain\api-gateway
start "MedChain API Gateway" cmd /k "npm start"
timeout /t 3

echo.
echo Starting Frontend...
cd ..\..\..\legacy_prototype
start "MedChain Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Services Starting...
echo.
echo Wait 10 seconds for both to start...
echo.
timeout /t 10

echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo MedChain is Running! ✅
echo ========================================
echo.
echo Backend API: http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Test endpoints:
echo - GET http://localhost:4000/api/fabric/health
echo.
echo To stop: Close the terminal windows
echo.
pause
