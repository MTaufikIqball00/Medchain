# 📮 POSTMAN GUIDE: Testing Hyperledger Fabric API

## 📌 SETUP:

### 1. Download Postman
```
https://www.postman.com/downloads/
```

### 2. Install & Open Postman

### 3. Base URL untuk requests
```
http://localhost:4000
```

---

## 🔗 API ENDPOINTS

### 1. ✅ HEALTH CHECK

**Method:** GET  
**URL:** `http://localhost:4000/api/fabric/health`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "status": "Fabric API is running",
  "mode": "MOCK",
  "recordCount": 5,
  "timestamp": "2025-01-20T15:39:52.405Z"
}
```

---

### 2. ✅ CREATE RECORD (NEW TRANSACTION)

**Method:** POST  
**URL:** `http://localhost:4000/api/fabric/records`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "patientName": "Ahmad Rizki",
  "patientId": "P001",
  "diagnosis": "Flu Biasa",
  "treatment": "Istirahat & Minum banyak air",
  "symptoms": "Demam 38 derajat",
  "department": "Poli Umum",
  "doctorName": "Dr. Budi",
  "dataHash": "abc123def456",
  "isEncrypted": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-456",
    "transactionId": "FABRIC_TX_ID_1705762520000",
    "timestamp": 1705762520000
  }
}
```

**⭐ COPY `transactionId` untuk test berikutnya!**

---

### 3. ✅ GET ALL RECORDS

**Method:** GET  
**URL:** `http://localhost:4000/api/fabric/records`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "REC-1705762520000-456",
      "patientName": "Ahmad Rizki",
      "patientId": "P001",
      "diagnosis": "Flu Biasa",
      "treatment": "Istirahat & Minum banyak air",
      "symptoms": "Demam 38 derajat",
      "department": "Poli Umum",
      "doctorName": "Dr. Budi",
      "fabricTxId": "FABRIC_TX_ID_1705762520000",
      "createdAt": "2025-01-20T15:39:52.405Z",
      "updatedAt": "2025-01-20T15:39:52.405Z",
      "version": 1
    }
  ]
}
```

---

### 4. ✅ GET SPECIFIC RECORD

**Method:** GET  
**URL:** `http://localhost:4000/api/fabric/records/REC-1705762520000-456`

(Ganti `REC-1705762520000-456` dengan recordId dari CREATE)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-456",
    "patientName": "Ahmad Rizki",
    "patientId": "P001",
    ...
  }
}
```

---

### 5. ✅ GET TRANSACTION HISTORY (BY TX ID)

**Method:** GET  
**URL:** `http://localhost:4000/api/fabric/records/FABRIC_TX_ID_1705762520000/history`

(Ganti `FABRIC_TX_ID_1705762520000` dengan transactionId dari CREATE)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "FABRIC_TX_ID_1705762520000",
      "functionName": "CreateRecord",
      "timestamp": 1705762520000,
      "status": "COMMITTED"
    }
  ]
}
```

---

### 6. ✅ UPDATE RECORD

**Method:** PUT  
**URL:** `http://localhost:4000/api/fabric/records/REC-1705762520000-456`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "diagnosis": "Flu Berat - Updated",
  "treatment": "Antibiotik + Istirahat",
  "dataHash": "xyz789abc123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-456",
    "transactionId": "FABRIC_TX_ID_1705762520001",
    "timestamp": 1705762521000
  }
}
```

---

### 7. ✅ DELETE RECORD

**Method:** DELETE  
**URL:** `http://localhost:4000/api/fabric/records/REC-1705762520000-456`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-456",
    "transactionId": "FABRIC_TX_ID_1705762520002",
    "timestamp": 1705762522000
  }
}
```

---

## 🧪 TESTING SCENARIOS

### SCENARIO 1: Full CRUD Flow

**Step 1: Create Record**
```
1. POST /api/fabric/records
2. Copy transactionId dari response
3. Catat recordId juga
```

**Step 2: Get Record**
```
1. GET /api/fabric/records/{recordId}
2. Lihat: Data record yang baru dibuat
3. Verifikasi: patientName, diagnosis, etc
```

**Step 3: Get All Records**
```
1. GET /api/fabric/records
2. Lihat: Record baru ada di list
3. Count: Jumlah records bertambah
```

**Step 4: Get Transaction History**
```
1. GET /api/fabric/records/{transactionId}/history
2. Lihat: Transaction details
3. Verify: Status = "COMMITTED"
```

**Step 5: Update Record**
```
1. PUT /api/fabric/records/{recordId}
2. Change: diagnosis, treatment
3. Copy: New transactionId
```

**Step 6: Check Transaction History Again**
```
1. GET /api/fabric/records/{oldTransactionId}/history
2. Lihat: History masih ada
3. Lihat: New TX juga tertrack
```

**Step 7: Delete Record**
```
1. DELETE /api/fabric/records/{recordId}
2. Lihat: Success response
3. Verify: Record masih ada (soft delete)
```

---

## 🔍 FABRIC TRANSACTION VERIFICATION

### How to Find Fabric TX Block

**Step 1: Create Record & Get TX ID**
```
POST /api/fabric/records
Response: "transactionId": "FABRIC_TX_ID_1705762520000"
```

**Step 2: Query Transaction History**
```
GET /api/fabric/records/FABRIC_TX_ID_1705762520000/history
Response: Shows transaction details including:
  - transactionId
  - functionName
  - timestamp
  - status (COMMITTED)
```

**Step 3: Verify in Backend Logs**
Check Terminal 1 (Backend) untuk lihat:
```
[API] POST /api/fabric/records
[FABRIC] Creating record...
[FABRIC] Submitting to Fabric: REC-1705762520000-456
[HYPERLEDGER FABRIC] Invoking Chaincode: CreateRecord
[FABRIC] ✅ Record created: REC-1705762520000-456, TX: FABRIC_TX_ID_1705762520000
```

---

## 📊 RESPONSE STATUS CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Create/Read/Update record |
| 404 | Not Found | Record ID tidak ada |
| 500 | Server Error | Backend error |

---

## 🎯 POSTMAN TIPS

### 1. Save Requests as Collection
```
1. Click: "Save" after typing request
2. Create Collection: "MedChain Fabric API"
3. Save each request di collection
4. Reuse nanti!
```

### 2. Use Variables for Dynamic Data
```
1. Click: "Pre-request Script"
2. Add:
   var recordId = pm.response.json().data.recordId;
   pm.environment.set("recordId", recordId);

3. Use di URL: 
   http://localhost:4000/api/fabric/records/{{recordId}}
```

### 3. Create Test Automation
```
1. Click: "Tests" tab
2. Add:
   pm.test("Status is 200", function() {
       pm.response.to.have.status(200);
   });
   pm.test("Success true", function() {
       var jsonData = pm.response.json();
       pm.expect(jsonData.success).to.be.true;
   });
```

---

## 🚀 QUICK START POSTMAN

### Import Collection (Alternative)

**File:** postman_collection.json
```json
{
  "info": {
    "name": "MedChain Fabric API",
    "description": "Hyperledger Fabric Medical Records API"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:4000/api/fabric/health"
      }
    },
    {
      "name": "Create Record",
      "request": {
        "method": "POST",
        "url": "http://localhost:4000/api/fabric/records",
        "body": {
          "mode": "raw",
          "raw": "{...}"
        }
      }
    }
  ]
}
```

---

## 📝 TESTING CHECKLIST

- [ ] Health check returns 200
- [ ] Create record returns transactionId
- [ ] Get all records shows new record
- [ ] Get specific record returns correct data
- [ ] Transaction history shows COMMITTED
- [ ] Update record creates new TX
- [ ] Delete record soft-deletes
- [ ] All responses have "success": true

---

## 🔗 REFERENCE

**Backend Running?**
```
Terminal 1: npm start (port 4000)
Expected: API Gateway listening at http://localhost:4000
```

**All Endpoints Summary:**
```
GET  /api/fabric/health                              ← Health check
POST /api/fabric/records                             ← Create
GET  /api/fabric/records                             ← Read all
GET  /api/fabric/records/:recordId                   ← Read one
GET  /api/fabric/records/:recordId/history           ← Transaction history
PUT  /api/fabric/records/:recordId                   ← Update
DELETE /api/fabric/records/:recordId                 ← Delete
```

---

**Gunakan Postman untuk test API dan verifikasi Fabric TX! 🚀**
