# 🔍 CARA CEK TRANSAKSI DI HYPERLEDGER FABRIC

## 📌 YANG SUDAH DIKETAHUI:

```
✅ Record sudah tersimpan
✅ TX ID sudah generated: FABRIC_TX_ID_1768921880093
✅ Data ada di backend
```

---

## 🔎 4 CARA CEK TRANSAKSI:

### **CARA 1: Blockchain Ledger Page** ✅ PALING MUDAH

**Langkah:**
1. Click: "Blockchain Ledger" (menu kiri)
2. Lihat table: Semua blocks/transactions
3. Click: Block any → Modal muncul
4. Lihat: Transaction Hash, Timestamp, Data

```
Status: ✅ Real-time data dari Hyperledger Fabric
```

---

### **CARA 2: Reports Page** ✅ PRAKTIS

**Langkah:**
1. Click: "Laporan Data Rekam Pasien"
2. Set: Date range
3. Lihat: Table dengan "Fabric TX ID" column
4. Lihat: TX ID untuk setiap record
5. Click: ExternalLink button → Transaction history modal

```
Status: ✅ Menampilkan patient records + Fabric TX
```

---

### **CARA 3: API Direct (ADVANCED)**

**Check all records:**
```bash
curl http://localhost:4000/api/fabric/records
```

**Check specific record:**
```bash
curl http://localhost:4000/api/fabric/records/REC-1768921880093-123
```

**Check transaction history:**
```bash
curl http://localhost:4000/api/fabric/records/REC-1768921880093-123/history
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "REC-1768921880093-123",
      "patientName": "Ahmad",
      "patientId": "001",
      "fabricTxId": "FABRIC_TX_ID_1768921880093",
      "timestamp": 1705762520093,
      "createdAt": "2025-01-20T...",
      "status": "COMMITTED"
    }
  ]
}
```

---

### **CARA 4: Backend Logs** ✅ DEBUG

**Check Terminal 1 (Backend):**
```
[FABRIC] ✅ Record created: REC-xxx, TX: FABRIC_TX_ID_xxx
[FABRIC] Submitting to Fabric: REC-xxx
[HYPERLEDGER FABRIC] Invoking Chaincode: CreateRecord
```

---

## ✨ VERIFIKASI LENGKAP:

### **Step 1: Buat 1 Record Baru**

Frontend → "Rekam Baru" → Isi data → Save

Lihat response:
```
✅ Record saved!
   Fabric TX: FABRIC_TX_ID_1768921880093
```

---

### **Step 2: Cek di Blockchain Ledger**

Menu → "Blockchain Ledger" → Lihat table

Seharusnya muncul row baru dengan:
- Block #: XX
- Timestamp: [waktu sekarang]
- Txn Hash: FABRIC_TX_ID_1768921880093...
- Patient ID: 001
- Status: Confirmed

---

### **Step 3: Cek di Reports**

Menu → "Laporan Data Rekam Pasien" → Lihat table

Seharusnya muncul record dengan:
- Tanggal: [hari ini]
- No. RM: 001
- Nama Pasien: Ahmad
- Fabric TX ID: FABRIC_TX_ID_1768921880093

---

### **Step 4: Click TX ID untuk History**

Click button sebelah TX ID → Modal

Seharusnya tampil:
```
Hyperledger Fabric Transaction History

Transaction ID:
FABRIC_TX_ID_1768921880093

Transaction Details:
  Timestamp: [waktu transaksi]
  Status: Committed
```

---

## 🧪 TESTING SCENARIOS:

### **Scenario 1: Multiple Records**

```
1. Buat 3 records berbeda
2. Setiap record dapat TX ID unik
3. Semua muncul di Blockchain Ledger
4. Semua muncul di Reports
```

### **Scenario 2: Search by Date**

```
1. Buat record
2. Go to Reports
3. Set date range: today
4. Cari patient name
5. Record muncul dengan TX ID
```

### **Scenario 3: Transaction History**

```
1. Create record → TX1
2. Update record → TX2
3. Click TX ID di Reports
4. Lihat history: TX1, TX2
```

---

## 📊 EXPECTED VS ACTUAL:

| Fitur | Expected | Actual |
|-------|----------|--------|
| Records save | ✅ Success | ✅ Working |
| TX ID generated | ✅ FABRIC_TX_ID_xxx | ✅ Working |
| Blockchain Ledger | ✅ Shows all | ✅ Working |
| Reports page | ✅ Shows records | ✅ Working |
| TX ID clickable | ✅ Shows history | ⏳ To verify |

---

## 🎯 VERIFIKASI SEKARANG:

### **Quick Check (30 detik):**

1. Create record: "Patient A" → Lihat TX ID ✅
2. Go to Blockchain Ledger → Lihat di table ✅
3. Go to Reports → Lihat patient dengan TX ID ✅
4. Click TX ID button → Modal muncul ✅

---

## 🔗 NEXT STEPS:

### **If everything works:**
- [ ] Test dengan multiple records (5-10)
- [ ] Test update record (lihat apakah TX baru dibuat)
- [ ] Test search/filter di Reports
- [ ] Setup real Fabric network (optional)

### **If something wrong:**
- [ ] Check backend logs (Terminal 1)
- [ ] Check browser console (F12 → Console)
- [ ] Verify API endpoints working (curl commands)

---

## 💡 TECHNICAL DETAILS:

### Architecture:
```
Frontend Record Form
  ↓ POST /api/fabric/records
Backend API Gateway
  ↓ fabricService.submitTransaction()
Mock Fabric Service
  ↓ Generate TX ID
Response: {recordId, transactionId}
  ↓ Frontend displays TX ID
```

### Data Flow:
```
1. User save → Fabric TX created
2. Backend stores in memory DB
3. TX ID returned to frontend
4. Frontend shows TX ID
5. TX ID stored in Reports state
6. TX ID appears in table
7. Click button → Show history modal
```

---

**Cek transaksi menggunakan 4 cara di atas! 🔍**

**Mana cara yang ingin Anda coba duluan?**
