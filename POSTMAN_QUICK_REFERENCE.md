# 📮 POSTMAN - Quick Reference Card

## 🎯 Base URL
```
http://localhost:4000
```

---

## 📋 7 ENDPOINTS

### 1. Health Check
```
GET /api/fabric/health
→ Check if API running
→ Response: status, mode, recordCount
```

### 2. Create Record (NEW TX)
```
POST /api/fabric/records
→ Create medical record
→ Response: recordId, transactionId ⭐
→ Body: JSON with patient data
```

### 3. Get All Records
```
GET /api/fabric/records
→ List semua records
→ Response: Array of records
```

### 4. Get One Record
```
GET /api/fabric/records/{recordId}
→ Get specific record
→ Replace: {recordId} dengan REC-xxx
```

### 5. Get Transaction History ⭐
```
GET /api/fabric/records/{fabricTxId}/history
→ Get TX details & history
→ Replace: {fabricTxId} dengan FABRIC_TX_ID_xxx
→ Shows: timestamp, status (COMMITTED)
```

### 6. Update Record
```
PUT /api/fabric/records/{recordId}
→ Update existing record
→ Body: Updated fields only
→ Response: New transactionId
```

### 7. Delete Record
```
DELETE /api/fabric/records/{recordId}
→ Soft delete record
→ Response: transactionId
```

---

## 🧪 TEST FLOW (Copy-Paste)

### STEP 1: Health Check
```
GET: http://localhost:4000/api/fabric/health
```
✅ Expected: 200 OK

---

### STEP 2: Create Record
```
POST: http://localhost:4000/api/fabric/records

BODY (raw JSON):
{
  "patientName": "Test Patient",
  "patientId": "TEST001",
  "diagnosis": "Test Diagnosis",
  "treatment": "Test Treatment",
  "symptoms": "Test Symptoms",
  "department": "Poli Umum",
  "doctorName": "Dr. Test",
  "dataHash": "hash123",
  "isEncrypted": true
}
```
✅ Expected: 200 OK
📌 Copy: recordId & transactionId

---

### STEP 3: Get All Records
```
GET: http://localhost:4000/api/fabric/records
```
✅ Expected: 200 OK
📌 See your new record in list

---

### STEP 4: Get Specific Record
```
GET: http://localhost:4000/api/fabric/records/{recordId}
```
Replace {recordId} dengan dari STEP 2
✅ Expected: 200 OK + record details

---

### STEP 5: Get Transaction History
```
GET: http://localhost:4000/api/fabric/records/{transactionId}/history
```
Replace {transactionId} dengan dari STEP 2
✅ Expected: 200 OK + transaction details
```
{
  "transactionId": "FABRIC_TX_ID_xxx",
  "functionName": "CreateRecord",
  "timestamp": "...",
  "status": "COMMITTED"
}
```

---

### STEP 6: Update Record
```
PUT: http://localhost:4000/api/fabric/records/{recordId}

BODY (raw JSON):
{
  "diagnosis": "Updated Diagnosis",
  "treatment": "Updated Treatment"
}
```
Replace {recordId} dengan dari STEP 2
✅ Expected: 200 OK + new transactionId

---

### STEP 7: Delete Record
```
DELETE: http://localhost:4000/api/fabric/records/{recordId}
```
Replace {recordId} dengan dari STEP 2
✅ Expected: 200 OK

---

## 🔍 VERIFY FABRIC TX

### What is Fabric TX ID?
```
Format: FABRIC_TX_ID_1705762520000
Location: Response dari POST /api/fabric/records
Meaning: Unique transaction ID di Hyperledger Fabric
```

### How to Check TX Block?

**Method 1: Query History**
```
GET /api/fabric/records/{transactionId}/history
→ Shows all transaction details
→ Status: COMMITTED = Valid
```

**Method 2: Check Backend Logs**
```
Terminal 1 (Backend):
[FABRIC] ✅ Record created: REC-xxx, TX: FABRIC_TX_ID_xxx
[HYPERLEDGER FABRIC] Invoking Chaincode: CreateRecord
```

**Method 3: Check via UI**
```
Frontend → Blockchain Ledger
→ See all TX in table
→ Click block → See details
```

---

## 📊 Response Format

### Success (200)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error (404/500)
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🎯 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 Not Found | Endpoint wrong | Check URL spelling |
| Connection refused | Backend not running | `npm start` di Terminal 1 |
| Empty response | Port wrong | Use 4000 not 3001/5173 |
| 500 error | Backend error | Check Terminal 1 logs |

---

## 🚀 Tips

**Save Collection:**
```
File → Export → Collection
Share dengan team!
```

**Organize Requests:**
```
Create folders:
- Health
- Records (CRUD)
- Transactions
- Blockchain
```

**Test Automation:**
```
Tests tab → Add assertions
Run Collection → Auto test all
```

---

## ✅ Checklist

- [ ] Backend running (Terminal 1)
- [ ] Postman installed
- [ ] Health check returns 200
- [ ] Can create record
- [ ] Can view all records
- [ ] Can get transaction history
- [ ] Fabric TX ID visible
- [ ] Status shows COMMITTED

---

**Siap test API dengan Postman! 🚀**
