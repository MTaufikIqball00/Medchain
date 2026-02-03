# ⚡ Quick Start Guide - MedicalChain v2.0

## 🚀 5-Minute Setup

### Step 1: Start Infrastructure
```bash
cd national-health-record-ledger/docker
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Ganache/Ethereum (port 8545)

### Step 2: Deploy Ethereum Contract
```bash
cd national-health-record-ledger/on-chain/ethereum
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

Copy the contract address and update `.env`:
```
ETH_CONTRACT_ADDRESS=0x...
```

### Step 3: Install API Dependencies & Start
```bash
cd national-health-record-ledger/off-chain/api-gateway
npm install
npm start
```

---

## 🧪 Test Cross-Hospital Flow

### Register Hospitals
```bash
# Hospital A
curl -X POST http://localhost:4000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"RS-A","name":"Rumah Sakit A","password":"pass123"}'

# Hospital B  
curl -X POST http://localhost:4000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"RS-B","name":"Rumah Sakit B","password":"pass123"}'
```

### Login & Get Tokens
```bash
# Login RS-A
TOKEN_A=$(curl -s -X POST http://localhost:4000/api/hospitals/login \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"RS-A","password":"pass123"}' | jq -r '.data.token')

# Login RS-B
TOKEN_B=$(curl -s -X POST http://localhost:4000/api/hospitals/login \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"RS-B","password":"pass123"}' | jq -r '.data.token')
```

### RS-A Creates Patient & Record
```bash
# Create Patient
PATIENT=$(curl -s -X POST http://localhost:4000/api/patients \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Jane Doe","nik":"3201012345678901"}' | jq -r '.data.patient_uid')

# Create Record
RECORD=$(curl -s -X POST http://localhost:4000/api/fabric/records \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"patient_uid\":\"$PATIENT\",\"diagnosis\":\"Flu\",\"doctor_name\":\"Dr. A\"}" | jq -r '.data.record_id')
```

### RS-B Tries to Access (DENIED)
```bash
curl http://localhost:4000/api/fabric/records/$RECORD \
  -H "Authorization: Bearer $TOKEN_B"
# Response: {"success":false,"error":"Access denied..."}
```

### RS-B Requests Access
```bash
curl -X POST http://localhost:4000/api/access/request \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{\"record_id\":\"$RECORD\"}"
```

### RS-A Grants Access
```bash
curl -X POST http://localhost:4000/api/access/grant \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"record_id\":\"$RECORD\",\"requester_hospital_id\":\"RS-B\"}"
```

### RS-B Now Has Access!
```bash
curl http://localhost:4000/api/fabric/records/$RECORD \
  -H "Authorization: Bearer $TOKEN_B"
# Response: {"success":true,"access_type":"GRANTED","data":{...}}
```

---

## 📮 Use Postman Instead

1. Import `postman_collection.json`
2. Run requests in order (1→2→3→4→5)
3. Variables auto-save between requests

---

## 🛑 Troubleshooting

| Issue | Solution |
|-------|----------|
| PostgreSQL not connecting | Check `docker ps` and port 5432 |
| "Hospital not found" | Register hospital first |
| "Access denied" | Request → Grant access first |
| Ethereum errors | Deploy contract, update .env |
