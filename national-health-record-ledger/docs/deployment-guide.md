# Deployment Guide

## Prerequisites

- Node.js v18+
- npm or yarn
- PostgreSQL 14+
- Docker (optional, for Hyperledger Fabric)

---

## Step 1: Install Dependencies

```bash
# On-chain (Ethereum)
cd national-health-record-ledger/on-chain/ethereum
npm install

# Off-chain (API Gateway)
cd ../off-chain/api-gateway
npm install
```

---

## Step 2: Start Ganache

**Option A: CLI (Recommended)**
```bash
npx ganache --mnemonic "test test test test test test test test test test test junk" \
            --port 8545 \
            --chain.chainId 1337
```

**Option B: With Persistence**
```bash
npx ganache --mnemonic "test test test test test test test test test test test junk" \
            --port 8545 \
            --database.dbPath ./ganache-data
```

---

## Step 3: Deploy Smart Contracts

```bash
cd national-health-record-ledger/on-chain/ethereum

# Compile contracts
npx hardhat compile

# Deploy MedicalAnchor (if not already deployed)
npx hardhat run scripts/deploy.js --network ganache

# Deploy MedicalDataRequest
npx hardhat run scripts/deploy_MedicalDataRequest.js --network ganache
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════════╗
║   MedicalDataRequest Contract Deployment                       ║
╚════════════════════════════════════════════════════════════════╝

📋 Deployer (Admin): 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
🚀 Deploying MedicalDataRequest contract...
✅ Contract deployed to: 0x1234...

ADD TO YOUR .env FILE:
DATA_REQUEST_CONTRACT_ADDRESS=0x1234...
```

---

## Step 4: Configure Environment

```bash
cd national-health-record-ledger/off-chain/api-gateway

# Copy example
cp .env.example .env

# Edit .env and update:
# - DATA_REQUEST_CONTRACT_ADDRESS (from Step 3 output)
# - PG_PASSWORD
# - JWT_SECRET
```

---

## Step 5: Start PostgreSQL

```bash
# Using Docker
docker run -d --name medchain-postgres \
  -e POSTGRES_DB=medicalchain \
  -e POSTGRES_USER=medchain \
  -e POSTGRES_PASSWORD=medchain123 \
  -p 5432:5432 \
  postgres:14

# Or connect to existing PostgreSQL and create database:
createdb medicalchain
```

---

## Step 6: Start API Server

```bash
cd national-health-record-ledger/off-chain/api-gateway

# Development
npm run dev

# Production
npm start
```

**Expected output:**
```
🔄 Initializing database...
✅ API Gateway listening at http://localhost:4000
📍 Mode: REAL
📍 Database: PostgreSQL
```

---

## Step 7: Verify Deployment

```bash
# Health check
curl http://localhost:4000/api/fabric/health

# Expected:
# {"success":true,"status":"API Gateway is running","mode":"REAL"...}
```

---

## Step 8: Run Tests

```bash
# Smart contract tests
cd national-health-record-ledger/on-chain/ethereum
npx hardhat test

# E2E API tests
cd ../scripts
node test_data_request_flow.js
```

---

## Quick Commands Reference

```bash
# Start everything (3 terminals)
# Terminal 1: Ganache
npx ganache --mnemonic "test test test test test test test test test test test junk" --port 8545

# Terminal 2: API Server
cd national-health-record-ledger/off-chain/api-gateway && npm start

# Terminal 3: Tests
cd national-health-record-ledger/scripts && node test_data_request_flow.js
```

---

## Verification Checklist

- [ ] Ganache running on port 8545
- [ ] Contracts deployed and addresses in .env
- [ ] PostgreSQL running and accessible
- [ ] API Gateway responding on port 4000
- [ ] Health endpoint returns success
- [ ] Smart contract tests pass
- [ ] E2E flow test passes
