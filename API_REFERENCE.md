# 📡 MedChain API Documentation

## Base URL
```
http://localhost:4000/api
```

---

## Health Check

### Check API Status
```
GET /api/fabric/health
```

**Response** (Success):
```json
{
  "status": "healthy",
  "connected": true,
  "message": "Hyperledger Fabric Gateway is connected",
  "recordCount": 0
}
```

**Response** (Error):
```json
{
  "status": "unhealthy",
  "connected": false,
  "message": "Hyperledger Fabric Gateway is not available",
  "error": "..."
}
```

---

## Create Medical Record

### Endpoint
```
POST /api/fabric/records
```

### Request Body
```json
{
  "recordId": "REC-12345",
  "patientName": "John Doe",
  "patientId": "P-001",
  "diagnosis": "Common Cold",
  "treatment": "Rest and fluids",
  "symptoms": "Cough, fever",
  "department": "General",
  "doctorName": "Dr. Smith",
  "dataHash": "hash123",
  "isEncrypted": false
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Medical record created successfully",
  "data": {
    "recordId": "REC-12345",
    "fabricTxId": "FABRIC_TX_12345...",
    "timestamp": 1674156000
  }
}
```

### cURL Example
```bash
curl -X POST http://localhost:4000/api/fabric/records \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "REC-TEST-001",
    "patientName": "Test Patient",
    "patientId": "P-TEST-001",
    "diagnosis": "Influenza",
    "treatment": "Antiviral medication",
    "symptoms": "Fever, headache",
    "department": "Internal Medicine",
    "doctorName": "Dr. Test",
    "dataHash": "test_hash",
    "isEncrypted": false
  }'
```

---

## Get All Records

### Endpoint
```
GET /api/fabric/records
```

### Response
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "recordId": "REC-001",
      "patientName": "John Doe",
      "diagnosis": "Common Cold",
      ...
    },
    ...
  ]
}
```

### cURL Example
```bash
curl http://localhost:4000/api/fabric/records
```

---

## Get Single Record

### Endpoint
```
GET /api/fabric/records/:recordId
```

### Example
```
GET /api/fabric/records/REC-001
```

### Response
```json
{
  "success": true,
  "data": {
    "recordId": "REC-001",
    "patientName": "John Doe",
    "patientId": "P-001",
    "diagnosis": "Common Cold",
    "treatment": "Rest and fluids",
    "symptoms": "Cough, fever",
    "department": "General",
    "doctorName": "Dr. Smith",
    "timestamp": 1674156000,
    "dataHash": "hash123",
    "isEncrypted": false
  }
}
```

### cURL Example
```bash
curl http://localhost:4000/api/fabric/records/REC-001
```

---

## Get Patient's Records

### Endpoint
```
GET /api/fabric/patients/:patientId/records
```

### Example
```
GET /api/fabric/patients/P-001/records
```

### Response
```json
{
  "success": true,
  "count": 2,
  "data": [
    {...},
    {...}
  ]
}
```

### cURL Example
```bash
curl http://localhost:4000/api/fabric/patients/P-001/records
```

---

## Update Record

### Endpoint
```
PUT /api/fabric/records/:recordId
```

### Request Body
```json
{
  "patientName": "John Doe",
  "patientId": "P-001",
  "diagnosis": "Severe Cold",
  "treatment": "Rest, fluids, and medicine",
  "symptoms": "Cough, fever, sore throat",
  "department": "General",
  "doctorName": "Dr. Smith",
  "dataHash": "newhash123"
}
```

### Response
```json
{
  "success": true,
  "message": "Medical record updated successfully",
  "data": {
    "recordId": "REC-001",
    "fabricTxId": "FABRIC_TX_UPDATE_...",
    "timestamp": 1674156100
  }
}
```

### cURL Example
```bash
curl -X PUT http://localhost:4000/api/fabric/records/REC-001 \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "John Doe",
    "diagnosis": "Severe Cold",
    "treatment": "Rest, fluids, and medicine",
    "symptoms": "Cough, fever, sore throat",
    "department": "General",
    "doctorName": "Dr. Smith",
    "dataHash": "newhash123"
  }'
```

---

## Delete Record

### Endpoint
```
DELETE /api/fabric/records/:recordId
```

### Response
```json
{
  "success": true,
  "message": "Medical record deleted successfully",
  "data": {
    "recordId": "REC-001",
    "fabricTxId": "FABRIC_TX_DELETE_...",
    "timestamp": 1674156200
  }
}
```

### cURL Example
```bash
curl -X DELETE http://localhost:4000/api/fabric/records/REC-001
```

---

## Get Transaction History

### Endpoint
```
GET /api/fabric/records/:recordId/history
```

### Response (Success)
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "timestamp": 1674156000,
      "status": "Committed",
      "dataHash": "hash123",
      "operator": "Dr. Smith",
      "txId": "FABRIC_TX_12345"
    },
    {
      "timestamp": 1674156100,
      "status": "Committed",
      "dataHash": "newhash123",
      "operator": "Dr. Smith",
      "txId": "FABRIC_TX_UPDATE_..."
    }
  ]
}
```

### Response (Not Available)
```json
{
  "success": false,
  "count": 0,
  "data": [],
  "message": "History unavailable: chaincode method not found"
}
```

### cURL Example
```bash
curl http://localhost:4000/api/fabric/records/REC-001/history
```

---

## Testing Workflow

### 1. Check Health
```bash
curl http://localhost:4000/api/fabric/health
```

### 2. Create Record
```bash
curl -X POST http://localhost:4000/api/fabric/records \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "TEST-001",
    "patientName": "Test",
    "patientId": "P-TEST",
    "diagnosis": "Test Diagnosis",
    "treatment": "Test Treatment",
    "symptoms": "Test Symptoms",
    "department": "Test",
    "doctorName": "Dr. Test",
    "dataHash": "test"
  }'
```

### 3. Get Record
```bash
curl http://localhost:4000/api/fabric/records/TEST-001
```

### 4. Get History
```bash
curl http://localhost:4000/api/fabric/records/TEST-001/history
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: recordId, patientId, patientName"
}
```

### 404 Not Found
```json
{
  "error": "Record not found"
}
```

### 500 Server Error
```json
{
  "error": "Failed to create medical record",
  "details": "..."
}
```

### 503 Service Unavailable
```json
{
  "status": "unhealthy",
  "connected": false,
  "message": "Hyperledger Fabric Gateway is not available"
}
```

---

## Testing with Postman

1. Open Postman
2. Create new Request
3. Set method (GET, POST, PUT, DELETE)
4. Set URL: `http://localhost:4000/api/...`
5. For POST/PUT:
   - Go to "Body" tab
   - Select "raw"
   - Select "JSON"
   - Paste JSON data
6. Click "Send"

---

## JavaScript/Fetch Example

### Get All Records
```javascript
fetch('http://localhost:4000/api/fabric/records')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Create Record
```javascript
fetch('http://localhost:4000/api/fabric/records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recordId: 'REC-001',
    patientName: 'John Doe',
    patientId: 'P-001',
    diagnosis: 'Cold',
    treatment: 'Rest',
    symptoms: 'Cough',
    department: 'General',
    doctorName: 'Dr. Smith',
    dataHash: 'hash123'
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## Notes

- **MOCK Mode**: All operations are simulated
- **REAL Mode**: Requires Hyperledger Fabric network running
- **Data**: Not persistent in MOCK mode
- **Transaction ID**: Only valid in REAL mode
- **History**: May be empty if chaincode doesn't support it
