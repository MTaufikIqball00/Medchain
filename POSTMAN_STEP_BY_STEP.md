# 📮 POSTMAN VISUAL GUIDE - Step by Step

## 🎯 SETUP (5 Menit)

### Step 1: Download Postman
```
1. Go to: https://www.postman.com/downloads/
2. Download for Windows
3. Install & Open
```

### Step 2: Import Collection (OPTIONAL tapi RECOMMENDED)
```
1. Postman → File → Import
2. Select: postman_collection.json
3. Click: Import
4. Lihat: 7 requests ready to use!
```

atau MANUAL (skip to Step 3)

### Step 3: Create New Request
```
1. Click: + (New tab)
2. Choose: GET, POST, PUT, DELETE
3. Enter URL
4. Send
```

---

## 🚀 QUICK TEST (15 Menit)

### Request 1: Health Check

**Di Postman:**

1. **Method:** SELECT `GET`
2. **URL:** PASTE `http://localhost:4000/api/fabric/health`
3. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "status": "Fabric API is running",
  "mode": "MOCK",
  "recordCount": 5,
  "timestamp": "2025-01-20T15:39:52.405Z"
}
```

✅ **Status:** 200 OK

---

### Request 2: Create Record (IMPORTANT!)

**Di Postman:**

1. **Method:** SELECT `POST`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records`
3. **Headers:** Click "Headers" tab
   - Key: `Content-Type`
   - Value: `application/json`
   - ✅ Check
4. **Body:** Click "Body" tab → Select "raw" → Select "JSON"
5. **PASTE:**
```json
{
  "patientName": "Budi Santoso",
  "patientId": "P123",
  "diagnosis": "Hipertensi Grade 2",
  "treatment": "Ramipril 5mg per hari",
  "symptoms": "Tekanan darah tinggi, sakit kepala",
  "department": "Poli Jantung",
  "doctorName": "Dr. Sari Wijaya",
  "dataHash": "hash_patient_p123",
  "isEncrypted": true
}
```
6. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-789",
    "transactionId": "FABRIC_TX_ID_1705762520000",
    "timestamp": 1705762520000
  }
}
```

✅ **Status:** 200 OK

📌 **COPY & SAVE:**
- `recordId`: `REC-1705762520000-789`
- `transactionId`: `FABRIC_TX_ID_1705762520000`

---

### Request 3: Get All Records

**Di Postman:**

1. **Method:** SELECT `GET`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records`
3. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "REC-1705762520000-789",
      "patientName": "Budi Santoso",
      "patientId": "P123",
      "diagnosis": "Hipertensi Grade 2",
      ...
      "fabricTxId": "FABRIC_TX_ID_1705762520000"
    },
    ... (other records)
  ]
}
```

✅ **Status:** 200 OK
✅ **See:** Your new record in the list!

---

### Request 4: Get Specific Record

**Di Postman:**

1. **Method:** SELECT `GET`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records/REC-1705762520000-789`
   - (Replace `REC-1705762520000-789` dengan recordId dari Request 2)
3. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-789",
    "patientName": "Budi Santoso",
    ...
  }
}
```

✅ **Status:** 200 OK

---

### Request 5: Get Transaction History ⭐ FABRIC BLOCK CHECK!

**Di Postman:**

1. **Method:** SELECT `GET`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records/FABRIC_TX_ID_1705762520000/history`
   - (Replace `FABRIC_TX_ID_1705762520000` dengan transactionId dari Request 2)
3. **Send:** CLICK "Send"

**Response (Expected):**
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

✅ **Status:** 200 OK
✅ **Key:** `status: COMMITTED` = Transaction valid di Fabric! 🎉

---

### Request 6: Update Record

**Di Postman:**

1. **Method:** SELECT `PUT`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records/REC-1705762520000-789`
   - (Replace recordId dengan dari Request 2)
3. **Headers:** Content-Type: application/json
4. **Body:** raw JSON:
```json
{
  "diagnosis": "Hipertensi Grade 2 - Dimonitor",
  "treatment": "Ramipril 10mg + Amlodipine 5mg"
}
```
5. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-789",
    "transactionId": "FABRIC_TX_ID_1705762520001",
    "timestamp": 1705762521000
  }
}
```

✅ **Status:** 200 OK
📌 **NEW TX ID:** `FABRIC_TX_ID_1705762520001` (berbeda dari yang lama!)

---

### Request 7: Delete Record

**Di Postman:**

1. **Method:** SELECT `DELETE`
2. **URL:** PASTE `http://localhost:4000/api/fabric/records/REC-1705762520000-789`
   - (Replace recordId)
3. **Send:** CLICK "Send"

**Response (Expected):**
```json
{
  "success": true,
  "data": {
    "recordId": "REC-1705762520000-789",
    "transactionId": "FABRIC_TX_ID_1705762520002",
    "timestamp": 1705762522000
  }
}
```

✅ **Status:** 200 OK

---

## 🔍 HOW TO CHECK FABRIC TX BLOCK

### Method 1: Query History (RECOMMENDED)

```
GET: http://localhost:4000/api/fabric/records/{transactionId}/history
Response: Shows transaction details + status COMMITTED
```

### Method 2: View in Browser

```
1. Frontend: Laporan Data Rekam Medis
2. Click: Fabric TX ID button
3. Modal: Shows transaction history
```

### Method 3: Check Backend Logs

```
Terminal 1 (Backend):
[FABRIC] ✅ Record created: REC-xxx, TX: FABRIC_TX_ID_xxx
[HYPERLEDGER FABRIC] Invoking Chaincode: CreateRecord
```

---

## ✅ VERIFICATION CHECKLIST

After completing all 7 requests:

- [ ] Health check: 200 OK
- [ ] Create record: Got transactionId
- [ ] Get all: See new record
- [ ] Get specific: Got record details
- [ ] Get history: See "COMMITTED" status ⭐
- [ ] Update: New TX created
- [ ] Delete: Record marked deleted

---

## 🎯 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Cannot connect | Check backend running: `npm start` |
| 404 error | Check URL spelling (http not https) |
| Empty response | Backend need restart |
| Wrong port | Use 4000 not 3001/5173 |

---

## 📚 REFERENCES

```
Postman: https://www.postman.com/
Collection File: postman_collection.json (di folder ini)
API Guide: POSTMAN_API_GUIDE.md
Quick Ref: POSTMAN_QUICK_REFERENCE.md
```

---

**Siap test! Follow langkah2 di atas! 🚀**
