# Troubleshooting Guide

## Common Issues and Solutions

---

### 1. Ganache Connection Failed

**Symptoms:**
```
Error: could not detect network
Error: connect ECONNREFUSED 127.0.0.1:8545
```

**Solutions:**
```bash
# Check if Ganache is running
lsof -i :8545

# Start Ganache
npx ganache --mnemonic "test test test test test test test test test test test junk" --port 8545

# If port in use, kill existing process
kill -9 $(lsof -t -i:8545)
```

---

### 2. Contract Not Found / Invalid Address

**Symptoms:**
```
Error: call revert exception
Error: contract not deployed
```

**Solutions:**
1. Verify contract address in `.env` matches deployed address
2. If Ganache restarted, **redeploy contracts**:
   ```bash
   cd on-chain/ethereum
   npx hardhat run scripts/deploy_MedicalDataRequest.js --network ganache
   ```
3. Update `.env` with new address

---

### 3. Hospital Not Registered

**Symptoms:**
```
Error: Only registered hospitals can perform this action
```

**Solutions:**
1. Check if hospital is registered on blockchain:
   ```javascript
   // In Hardhat console
   const contract = await ethers.getContractAt("MedicalDataRequest", "0x...");
   await contract.isHospitalRegistered("0x...");
   ```
2. Register hospital via deployment script or admin function

---

### 4. Rate Limit Exceeded

**Symptoms:**
```
Error: Rate limit exceeded: max 10 requests per hour
```

**Solutions:**
1. Wait 1 hour for rate limit to reset
2. Restart Ganache to reset blockchain state
3. Use different hospital account

---

### 5. Transaction Reverted

**Symptoms:**
```
Error: transaction reverted
Error: execution reverted
```

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Request already exists | Use unique request ID |
| Request not pending | Check status before approve/reject |
| Not the target hospital | Use correct hospital account |
| Access expired | Request new access |

---

### 6. PostgreSQL Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed
```

**Solutions:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (Docker)
docker start medchain-postgres

# Verify credentials in .env match PostgreSQL config
```

---

### 7. Private Key Not Found

**Symptoms:**
```
Error: No Ethereum private key configured for hospital: RS-X
```

**Solutions:**
1. Add private key to `.env`:
   ```
   ETH_PRIVATE_KEY_RS_X=0x...
   ```
2. Format: `ETH_PRIVATE_KEY_<HOSPITAL_ID_UPPERCASE_UNDERSCORES>`

---

### 8. JWT Authentication Failed

**Symptoms:**
```
Error: Invalid token
Error: jwt malformed
```

**Solutions:**
1. Re-login to get fresh token
2. Check token is in correct format: `Bearer <token>`
3. Verify `JWT_SECRET` in `.env`

---

## FAQ - Technical Questions

### Q1: What happens if Ganache node restarts? Are transactions lost?

**Answer:** Yes, by default Ganache runs in-memory. All data is lost on restart.

**Workarounds:**
1. **Persistence Mode:**
   ```bash
   npx ganache --database.dbPath ./ganache-data --mnemonic "..."
   ```
2. **Docker Volume:**
   ```bash
   docker run -v ./ganache-data:/data trufflesuite/ganache ...
   ```
3. **Recovery Plan:** Keep deployment scripts and re-run after restart

---

### Q2: Migration strategy from Ganache to Sepolia/Goerli testnet?

**Steps:**
1. Get testnet ETH from faucet (sepolia-faucet.pk910.de)
2. Create Alchemy/Infura account for RPC URL
3. Update `.env`:
   ```
   ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ```
4. Deploy to testnet:
   ```bash
   npx hardhat run scripts/deploy_MedicalDataRequest.js --network sepolia
   ```
5. Update contract address in `.env`

**Note:** Same contract code works on any EVM chain.

---

### Q3: Fallback mechanism if blockchain temporarily unavailable?

**Implementation (already in code):**
1. **Transaction Queue:** Failed transactions saved to PostgreSQL
2. **Retry Logic:** Exponential backoff (1s → 2s → 4s → max 60s)
3. **Status Tracking:** `BLOCKCHAIN_PENDING` vs `CONFIRMED`
4. **Off-chain Fallback:** Operations continue in PostgreSQL even if blockchain down

**Recovery:**
- Background worker retries queued transactions
- Blockchain eventually consistent with off-chain state

---

### Q4: Gas cost estimation for mainnet production?

**Estimated costs (at 30 gwei gas price, ~$2000/ETH):**

| Operation | Gas Units | Cost (30 gwei) | Cost (100 gwei) |
|-----------|-----------|----------------|-----------------|
| requestPatientData | ~150,000 | ~$9 | ~$30 |
| approveRequest | ~80,000 | ~$5 | ~$16 |
| rejectRequest | ~50,000 | ~$3 | ~$10 |
| anchorDataHash | ~100,000 | ~$6 | ~$20 |

**Per request cycle (request + approve + anchor):** $20-66

**Cost optimization strategies:**
1. Use Layer 2 (Polygon, Arbitrum): ~$0.01-0.10 per tx
2. Batch multiple anchors in one transaction
3. Consider private/consortium chains for high volume

---

### Q5: How to handle 100+ hospitals at scale?

**Current design supports:**
- Unlimited hospital registrations
- Rate limit per hospital (10 req/hour per hospital)
- No global rate limit

**Scaling considerations:**
1. **Fabric:** Handles consortium-level operations
2. **Ethereum:** Only critical anchoring and cross-hospital requests
3. **PostgreSQL:** Handles bulk of queries
4. **Caching:** Add Redis for frequent status checks

---

## Debug Commands

```bash
# Check contract deployment
npx hardhat console --network ganache
> const c = await ethers.getContractAt("MedicalDataRequest", "0x...");
> await c.getHospitalCount();

# Check request status
> await c.getRequestStatus("REQ-123");

# Check hospital registration
> await c.isHospitalRegistered("0x...");

# Get remaining rate limit
> await c.getRemainingRateLimit("0x...");
```

---

## Log Locations

| Component | Log Location |
|-----------|--------------|
| API Gateway | Terminal stdout |
| Ganache | Terminal stdout |
| Hardhat Tests | Terminal stdout |
| PostgreSQL | `docker logs medchain-postgres` |
