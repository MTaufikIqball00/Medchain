# Ganache Setup Guide for MedicalChain

## Quick Start

### Option 1: Ganache CLI (Recommended for Development)

```bash
# Install Ganache CLI globally
npm install -g ganache

# Start with reproducible mnemonic (consistent addresses)
ganache --mnemonic "test test test test test test test test test test test junk" \
        --port 8545 \
        --chain.chainId 1337 \
        --wallet.totalAccounts 10 \
        --wallet.defaultBalance 1000 \
        --miner.blockGasLimit 10000000

# Start with data persistence (survives restarts)
ganache --mnemonic "test test test test test test test test test test test junk" \
        --port 8545 \
        --database.dbPath ./ganache-data
```

### Option 2: Ganache GUI

1. Download from: https://trufflesuite.com/ganache/
2. Create new workspace
3. Settings → Server:
   - Port: 8545
   - Chain ID: 1337
4. Settings → Accounts & Keys:
   - Mnemonic: `test test test test test test test test test test test junk`
   - Account balance: 1000 ETH
   - Total accounts: 10

---

## Account Allocation (Using Standard Mnemonic)

| Account | Role | Address | Private Key (First 10 chars) |
|---------|------|---------|------------------------------|
| 0 | **Admin** | 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 | 0x4f3edf98... |
| 1 | **RS-A** (Siloam Jakarta) | 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 | 0x6cbed15c... |
| 2 | **RS-B** (Harapan Kita) | 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b | 0x6370fd03... |
| 3 | **RS-HASAN-SADIKIN** | 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC | 0x646f1ce2... |
| 4 | **RS-SILOAM** | 0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9 | 0xadd53f9a... |
| 5 | **RS-HERMINA** | 0x28a8746e75304c0780E011BEd21C72cD78cd535E | 0x395df67f... |
| 6-9 | Reserved for future | - | - |

---

## Configuration Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Port | 8545 | JSON-RPC port |
| Chain ID | 1337 | Network identifier |
| Network ID | 1337 | Same as Chain ID for Ganache |
| Gas Limit | 10,000,000 | Per block |
| Gas Price | 20 gwei | Default for transactions |
| Block Time | 0 (instant) | Auto-mine on transaction |

---

## Deployment Steps

```bash
# 1. Start Ganache (Terminal 1)
ganache --mnemonic "test test test test test test test test test test test junk" --port 8545

# 2. Deploy contracts (Terminal 2)
cd national-health-record-ledger/on-chain/ethereum

# Deploy MedicalAnchor (if not already deployed)
npx hardhat run scripts/deploy.js --network ganache

# Deploy MedicalDataRequest
npx hardhat run scripts/deploy_MedicalDataRequest.js --network ganache

# 3. Update .env with new contract addresses
# Copy the output contract addresses to your .env file
```

---

## Data Persistence

By default, Ganache runs in-memory. **Data is lost on restart.**

### Enable Persistence:

```bash
# CLI with database path
ganache --database.dbPath ./ganache-data --mnemonic "..."

# Or via Docker
docker run -d -p 8545:8545 \
  -v $(pwd)/ganache-data:/data \
  trufflesuite/ganache:latest \
  --mnemonic "test test test test test test test test test test test junk" \
  --database.dbPath /data
```

---

## Troubleshooting

### Port 8545 Already in Use
```bash
# Find and kill the process
lsof -i :8545
kill -9 <PID>
```

### Contract Not Found After Restart
- Ganache in-memory mode loses all data on restart
- Redeploy contracts after each Ganache restart
- Or use `--database.dbPath` for persistence

### Transaction Reverted
- Check if hospital is registered on the contract
- Verify private key matches the expected account
- Check gas limit is sufficient

### Rate Limit Exceeded
- Maximum 10 requests per hospital per hour
- Wait 1 hour or restart Ganache to reset
