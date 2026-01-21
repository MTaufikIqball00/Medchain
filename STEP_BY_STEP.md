# 🎯 STEP-BY-STEP: Cara Menjalankan MedChain

## 📋 Pilihan Mode

```
┌─────────────────────────────────────────────────────────┐
│  PILIH SALAH SATU:                                      │
├─────────────────────────────────────────────────────────┤
│  🟢 MOCK Mode (No Fabric)    👈 Mulai dari sini        │
│     - Cepat                                             │
│     - Tidak perlu setup Fabric                          │
│     - Cocok untuk testing/demo                          │
│                                                         │
│  🔵 REAL Mode (With Fabric)  👈 Setelah setup Fabric   │
│     - Perlu Hyperledger Fabric running                  │
│     - Lebih kompleks tapi realistic                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **OPSI A: MOCK MODE (RECOMMENDED PERTAMA KALI)**

### Timeline: ~15 menit

```
┌─────────────────┐
│   START HERE    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ 1. BUKA COMMAND PROMPT / POWERSHELL              │
│    Win + R → cmd → Enter                         │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 2. NAVIGATE KE FOLDER MEDCHAIN                   │
│    cd D:\UNIKOM\Semester 7\Blockchain\...        │
│       New folder\Medchain                        │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 3. JALANKAN SETUP.BAT                            │
│    setup.bat                                     │
│                                                  │
│    ✓ Check Node.js                              │
│    ✓ Check npm                                  │
│    ✓ Install backend dependencies (~5 min)     │
│    ✓ Install frontend dependencies (~5 min)    │
│                                                  │
│    TUNGGU SAMPAI SELESAI!                       │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 4. JALANKAN APP DALAM MOCK MODE                 │
│    run-mock.bat                                  │
│                                                  │
│    Ini akan membuka 2 windows baru:             │
│    ✓ Terminal 1: Backend API                   │
│    ✓ Terminal 2: Frontend React                │
│                                                  │
│    Browser otomatis ke localhost:5173           │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ ✅ SUCCESS!                                      │
│                                                  │
│ Backend:  http://localhost:4000                 │
│ Frontend: http://localhost:5173                 │
│                                                  │
│ Anda akan lihat login screen!                   │
└──────────────────────────────────────────────────┘
```

### Login Credentials
```
Username: doctor
Password: 1234
```

### Apa yang Bisa Anda Test
- ✅ Lihat Dashboard
- ✅ Buat Rekam Medis Baru
- ✅ Lihat Daftar Pasien
- ✅ Lihat Laporan dengan Fabric TX ID
- ✅ Klik TX ID untuk lihat transaction history (modal)

---

## 🔧 **OPSI B: MANUAL SETUP (Jika run-mock.bat error)**

### Timeline: ~5 menit

```
┌──────────────────────────────┐
│  TERMINAL 1: Backend API     │
└──────────────┬───────────────┘
               │
               ▼
    cd D:\UNIKOM\Semester 7\Blockchain\
    New folder\Medchain\national-health-record-ledger\
    off-chain\api-gateway
    
    npm install    (tunggu sampai selesai)
    npm start      (tunggu "listening at 4000")


┌──────────────────────────────┐
│  TERMINAL 2: Frontend         │
│  (Buka terminal baru - Alt+Tab) │
└──────────────┬───────────────┘
               │
               ▼
    cd D:\UNIKOM\Semester 7\Blockchain\
    New folder\Medchain\legacy_prototype
    
    npm install    (tunggu sampai selesai)
    npm run dev    (tunggu "ready in XXX ms")


┌──────────────────────────────┐
│  TERMINAL 3 (atau buka browser)  │
└──────────────┬───────────────┘
               │
               ▼
    http://localhost:5173
    
    ✅ Login screen muncul!
```

---

## 🛠️ **OPSI C: DENGAN REAL HYPERLEDGER FABRIC**

### Timeline: ~45 menit + Fabric setup

```
PREREQUISITE: Hyperledger Fabric sudah di-setup
  ✓ Fabric binaries terinstall
  ✓ Test network bisa dijalankan
  ✓ Docker available

STEP 1: Start Fabric Network
  Terminal:
  cd fabric-samples/test-network
  ./network.sh up createChannel -c medchannel
  
  Tunggu sampai selesai, verify dengan:
  docker ps
  (harusnya lihat 5+ containers)

STEP 2: Deploy Chaincode
  Follow commands di HYPERLEDGER_FABRIC_SETUP.md
  (copy medrecords.go ke test-network folder)
  (jalankan peer commands)

STEP 3: Edit .env di api-gateway
  BLOCKCHAIN_MODE=REAL
  (bukan MOCK)

STEP 4: Run Real Mode
  run-real.bat
  
  Atau manual:
  Terminal 1: cd api-gateway → npm start
  Terminal 2: cd legacy_prototype → npm run dev

STEP 5: Test
  Buat record → lihat Fabric TX ID di laporan
  TX ID akan berisi real transaction ID dari Fabric!
```

---

## 🎮 **SETELAH RUNNING: Coba Ini**

### 1. **Login**
```
Username: doctor
Password: 1234
Klik Login
```

### 2. **Dashboard**
- Lihat summary data
- Lihat chart

### 3. **Rekam Baru**
```
- Masukkan data pasien:
  • No. Rekam Medis: P-001
  • Nama Pasien: John Doe
  • Diagnosa: Influenza
  • Terapi: Antiviral
  • etc...
- Klik Submit
- Tunggu "Record saved successfully"
```

### 4. **Daftar Pasien**
- Lihat list pasien yang sudah dibuat
- Klik untuk lihat detail

### 5. **Laporan** ← PALING PENTING
```
- Filter by date range
- Search patient
- Lihat tabel records
- PERHATIKAN kolom "Fabric TX ID" 
  (ini adalah blockchain transaction!)
- Klik icon 🔗 untuk lihat modal dengan:
  • Transaction ID
  • Timestamp
  • Status (Committed)
  • Data Hash
  • Operator
```

### 6. **Blockchain Viewer** (jika ada)
- Lihat struktur blockchain
- Verify integrity

---

## ✅ **CHECKLIST KESUKSESAN**

### Backend (Terminal 1)
```
✓ npm install completed
✓ No errors
✓ "API Gateway listening at http://localhost:4000"
✓ Can access http://localhost:4000/api/fabric/health
```

### Frontend (Terminal 2)
```
✓ npm install completed
✓ No errors
✓ "VITE ready in XXX ms"
✓ "Local: http://localhost:5173"
✓ Browser tab opened automatically
```

### Application
```
✓ Login screen muncul
✓ Login berhasil
✓ Dashboard menampilkan data
✓ Menu items tersedia
✓ Bisa input data
✓ Fabric TX ID ada di laporan
✓ Transaction modal bisa di-open
```

---

## 🚨 **TROUBLESHOOTING CEPAT**

### "npm: command not found"
```
❌ PROBLEM: Node.js tidak terinstall
✅ SOLUTION: Download dan install https://nodejs.org/
```

### "Port 4000 already in use"
```
❌ PROBLEM: Ada aplikasi lain pakai port 4000
✅ SOLUTION: 
   Cari: netstat -ano | findstr :4000
   Kill: taskkill /PID [PID] /F
   Atau restart computer
```

### "Cannot find module 'express'"
```
❌ PROBLEM: npm install belum selesai
✅ SOLUTION: 
   cd api-gateway
   rm -rf node_modules
   npm install (ulang)
```

### "React tidak connect ke API"
```
❌ PROBLEM: API tidak jalan / URL salah
✅ SOLUTION:
   1. Cek api-gateway terminal - ada error?
   2. Test manual: curl http://localhost:4000/api/fabric/health
   3. Cek .env.local: VITE_API_URL=http://localhost:4000/api
   4. Refresh browser: Ctrl+Shift+R
```

### "Error 503 Service Unavailable"
```
❌ PROBLEM: REAL mode tapi Fabric tidak running
✅ SOLUTION:
   - Switch ke MOCK mode: .env BLOCKCHAIN_MODE=MOCK
   - Atau setup Fabric dulu
```

---

## 📊 **EXPECTED OUTPUT**

### Successful Backend Start
```
[nodemon] restarting due to changes...
API Gateway listening at http://localhost:4000
Connected to Fabric (MOCK Mode)
```

### Successful Frontend Start
```
VITE v6.2.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Successful API Call
```
GET http://localhost:4000/api/fabric/health
Response:
{
  "status": "healthy",
  "connected": true,
  "message": "Hyperledger Fabric Gateway is connected",
  "recordCount": 0
}
```

---

## 📚 **NEXT STEPS SETELAH TESTING**

1. ✅ Test di MOCK mode
2. → Setup Hyperledger Fabric (baca HYPERLEDGER_FABRIC_SETUP.md)
3. → Deploy chaincode
4. → Switch ke REAL mode
5. → Test dengan real blockchain
6. → Deploy ke production

---

## 🎓 **LEARNING PATH**

```
Hari 1: Test MOCK mode ✓ (you are here)
Hari 2: Setup Hyperledger Fabric
Hari 3: Deploy chaincode
Hari 4: Test REAL mode
Hari 5: Optimize & production
```

---

## 📞 **TIPS & TRICKS**

1. **Jangan close terminal** - Aplikasi akan berhenti
2. **Lihat logs** - Terminal adalah sumber kebenaran
3. **Hard refresh** - Ctrl+Shift+R untuk clear cache
4. **Save .env** - Jangan lupa save setelah edit
5. **Check ports** - Pastikan 4000 & 5173 free
6. **Docker** - Untuk REAL mode, pastikan Docker running

---

## 🚀 **READY?**

```
Ikuti langkah-langkah di atas dan run:

setup.bat   (install dependencies)
    ↓
run-mock.bat  (start aplikasi)
    ↓
http://localhost:5173  (buka browser)
    ↓
Login & Test!  ✅
```

**LET'S GO! 🎉**
