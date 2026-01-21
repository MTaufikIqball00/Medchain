# 🖥️ Cara Menjalankan Backend API (api-gateway)

## Ada 2 Cara:

---

## ✅ **CARA 1: Automatic (Recommended)**

### Jalankan script:
```bash
run-mock.bat
```

**Ini akan automatically:**
- ✅ Buka Terminal 1 - Backend API (sudah di-configure)
- ✅ Buka Terminal 2 - Frontend React
- ✅ Buka browser

**Tidak perlu manual commands!**

---

## ⚙️ **CARA 2: Manual (Jika Perlu)**

### Step 1: Open Command Prompt

```bash
Win + R → cmd → Enter
```

### Step 2: Navigate ke Backend Folder

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
```

Verifikasi dengan:
```bash
dir
```

Anda harus lihat:
```
.env
package.json
index.js
connection-org1.json
fabric-client.js
etc...
```

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

**Ini akan:**
- Download semua packages dari internet
- Create `node_modules` folder
- Bisa memakan waktu 5-10 menit (depending on internet)

**Output akan berakhir dengan:**
```
added XXX packages
```

### Step 4: Start Backend Server

```bash
npm start
```

**Expected Output:**

```
> api-gateway@1.0.0 start
> node index.js

API Gateway listening at http://localhost:4000
--- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---
Backend is ready to receive requests
```

**Jangan close terminal ini!** Backend harus terus running.

---

## 📍 Lokasi Folder

```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\
    └── national-health-record-ledger\
        └── off-chain\
            └── api-gateway\   ← Ini folder yang perlu
                ├── .env                      ← Configuration
                ├── package.json              ← Dependencies
                ├── index.js                  ← Entry point
                ├── connection-org1.json      ← Fabric config
                ├── fabric-client.js          ← Fabric SDK
                ├── config.js                 ← Config handler
                ├── src/
                │   ├── controllers/
                │   │   └── recordController.js
                │   └── services/
                │       ├── realFabric.js
                │       ├── mockFabric.js
                │       └── etc...
                └── node_modules/             ← Created by npm install
```

---

## 🔍 Package.json

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "Hyperledger Fabric REST API Gateway",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",      ← Jalankan backend
    "dev": "node index.js",
    "test": "echo \"no test\""
  },
  "dependencies": {
    "express": "^5.2.1",           ← Web framework
    "fabric-network": "^2.2.20",   ← Fabric SDK
    "fabric-ca-client": "^2.2.20", ← Fabric CA
    "dotenv": "^17.2.3",           ← Environment variables
    "cors": "^2.8.5",              ← CORS support
    "body-parser": "^2.2.2",       ← JSON parser
    "uuid": "^13.0.0",             ← Generate UUIDs
    "crypto-js": "^4.2.0"          ← Encryption
    // NOTE: ethers.js REMOVED ✅
  }
}
```

---

## 🎯 What Each Command Does

### `npm install`
- Downloads all dependencies from npm registry
- Creates `node_modules` folder
- Updates `package-lock.json`
- Takes time: 5-10 minutes (first time)
- Only need to do once (or if package.json changes)

### `npm start`
- Runs `node index.js`
- Starts Express server
- Listens on port 4000
- Ready to receive API requests
- Runs indefinitely (Ctrl+C to stop)

---

## ✅ Success Indicators

### Terminal Output Should Show:
```
✓ "API Gateway listening at http://localhost:4000"
✓ "RUNNING IN MOCK SIMULATION MODE (FABRIC)"
✓ No error messages
```

### You Can Now:
```bash
# In another terminal, test the API:
curl http://localhost:4000/api/fabric/health
```

### Expected Response:
```json
{
  "status": "healthy",
  "connected": true,
  "message": "Hyperledger Fabric Gateway is connected",
  "recordCount": 0
}
```

---

## 🚨 Troubleshooting

### Error: "Cannot find module 'express'"
```
❌ npm install tidak selesai atau gagal
✅ Jalankan: npm install
   Tunggu sampai selesai
```

### Error: "EADDRINUSE :::4000"
```
❌ Port 4000 sudah dipakai aplikasi lain
✅ Option 1: Restart computer
   Option 2: Find & kill process:
   netstat -ano | findstr :4000
   taskkill /PID [PID_NUMBER] /F
   Option 3: Change PORT di .env
```

### Error: "Cannot read property 'submit' of undefined"
```
❌ Fabric network tidak running (jika REAL mode)
✅ Untuk development, gunakan MOCK mode:
   .env harus: BLOCKCHAIN_MODE=MOCK
```

### Error: "ENOENT: no such file or directory, open '.env'"
```
❌ .env file tidak ada
✅ Sudah dibuat oleh setup.bat
   Jika tidak ada, buat manual:
   echo BLOCKCHAIN_MODE=MOCK > .env
```

### Error: "Port already in use / Address already in use"
```
❌ Sesuai error - port sudah dipakai
✅ Ganti port di .env:
   PORT=4001
   Atau kill existing process
```

---

## 🔧 Configuration (.env)

File: `national-health-record-ledger/off-chain/api-gateway/.env`

```
BLOCKCHAIN_MODE=MOCK
FABRIC_CHANNEL_NAME=medchannel
FABRIC_CHAINCODE_NAME=medrecords
PORT=4000
```

### Penjelasan:
- **BLOCKCHAIN_MODE=MOCK** ← Use simulated blockchain (no Fabric needed)
- **BLOCKCHAIN_MODE=REAL** ← Use real Hyperledger Fabric
- **PORT=4000** ← Listen on port 4000
- Channel & Chaincode names untuk Fabric

---

## 🎯 API Endpoints (Jika Backend Running)

Anda bisa test endpoints:

### Health Check:
```bash
curl http://localhost:4000/api/fabric/health
```

### Get All Records:
```bash
curl http://localhost:4000/api/fabric/records
```

### Create Record:
```bash
curl -X POST http://localhost:4000/api/fabric/records \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "TEST-001",
    "patientName": "Test Patient",
    "patientId": "P-001",
    "diagnosis": "Test",
    "treatment": "Test",
    "symptoms": "Test",
    "department": "Test",
    "doctorName": "Dr. Test",
    "dataHash": "test"
  }'
```

---

## 📊 Backend Architecture

```
┌─────────────────────────────────────┐
│   index.js (Entry Point)            │
│   - Setup Express app               │
│   - Load routes                     │
│   - Start listening on 4000         │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Routes (recordController.js)      │
│   - POST /records                   │
│   - GET /records                    │
│   - GET /records/:id                │
│   - PUT /records/:id                │
│   - DELETE /records/:id             │
│   - GET /records/:id/history        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Services (Fabric)                 │
│   - mockFabric.js (for MOCK mode)   │
│   - realFabric.js (for REAL mode)   │
│   - fabric-client.js (SDK wrapper)  │
└────────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Blockchain          │
    │ MOCK or REAL        │
    └─────────────────────┘
```

---

## 🔌 Port & Endpoints

### Backend API:
```
Base URL: http://localhost:4000
API Prefix: /api
Full Example: http://localhost:4000/api/fabric/health
```

### Ports Used:
```
4000 ← Backend API
5173 ← Frontend React
7051 ← Fabric peer (if real mode)
7050 ← Fabric orderer (if real mode)
```

---

## 🎓 From Terminal Perspective

```
Terminal:
$ cd api-gateway
$ npm install          ← Download packages
$ npm start            ← Start server
  ↓
Output:
  API Gateway listening at http://localhost:4000
  ↓
Server is now:
  - Listening for requests
  - Processing API calls
  - Connecting to Fabric (MOCK)
  ↓
Keep running (don't close terminal!)
  ↓
Open another terminal for frontend
```

---

## ✅ Checklist

Sebelum jalankan `npm start`:

- [ ] Node.js installed
- [ ] npm installed
- [ ] Current folder = api-gateway
- [ ] .env file exists
- [ ] package.json exists
- [ ] npm install sudah selesai (node_modules exists)
- [ ] Port 4000 not in use

---

## 🚀 Quick Reference

```bash
# Step 1: Navigate
cd national-health-record-ledger\off-chain\api-gateway

# Step 2: Install (first time only)
npm install

# Step 3: Start
npm start

# Expected:
# "API Gateway listening at http://localhost:4000"

# Don't close this terminal!
```

---

## 🔗 Connection to Frontend

Backend sends responses to Frontend:

```
Frontend (http://localhost:5173)
    ↓
fetch('http://localhost:4000/api/fabric/records')
    ↓
Backend receives request
    ↓
Backend processes (Mock Fabric)
    ↓
Backend sends response (JSON)
    ↓
Frontend displays data
```

---

## 📝 Logs & Debugging

Backend will log:

```
[Fabric] Submitting CreateRecord...
[Fabric] Transaction committed: TX_ID_12345
[API] Request received: POST /records
[API] Response sent: 200 OK
```

Lihat terminal untuk debug information!

---

## 💡 Tips

1. **Always keep Terminal 1 running**
   - Don't close after npm start
   - Leave it minimized if needed

2. **Check Terminal output for errors**
   - If something fails, look at logs first
   - Most errors logged to console

3. **Use Ctrl+C to stop**
   - Gracefully stop server
   - Free up port 4000

4. **npm install is slow first time**
   - Gets faster on subsequent runs
   - Only need once per setup

5. **Port 4000**
   - Frontend connects to this port
   - Make sure it's not blocked by firewall

---

**Siap? Jalankan backend dengan `npm start` sekarang! 🚀**
