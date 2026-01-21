# 🚀 CARA MENJALANKAN MedChain

## 3 Cara Menjalankan (Pilih Salah Satu)

---

## ✅ **CARA 1: Cepat (Recommended - MOCK Mode)**
*Tidak perlu Hyperledger Fabric - hanya untuk testing/demo*

### Step 1: Buka Command Prompt / PowerShell

Tekan `Win + R`, ketik `cmd`, tekan Enter

```
C:\Users\YourName>
```

### Step 2: Navigate ke folder Medchain

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain
```

Verifikasi dengan command:
```bash
dir
```

Anda harus lihat folder seperti: `legacy_prototype`, `national-health-record-ledger`, `setup.bat`, dll

### Step 3: Jalankan Setup Script

```bash
setup.bat
```

Script ini akan:
- ✅ Cek Node.js, npm
- ✅ Install dependencies untuk backend
- ✅ Install dependencies untuk frontend
- Tunggu sampai selesai (bisa 5-10 menit)

### Step 4: Jalankan Aplikasi dalam MOCK Mode

```bash
run-mock.bat
```

Ini akan membuka 2 command windows baru dan start:
- Backend API di `http://localhost:4000`
- Frontend React di `http://localhost:5173`

Browser akan otomatis membuka

### Step 5: Test Aplikasi

Anda akan lihat:
- Login screen
- Dashboard
- Menu untuk "Rekam Baru", "Laporan", dll

**MOCK Mode berarti:**
- ✅ Blockchain operations are simulated
- ✅ Data tidak disimpan persistent
- ✅ Cocok untuk testing/demo

---

## ⚙️ **CARA 2: Manual (Step-by-Step)**

Jika `run-mock.bat` tidak bekerja, jalankan manual:

### Terminal 1: Backend API

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
npm install
npm start
```

Expected output:
```
API Gateway listening at http://localhost:4000
```

### Terminal 2: Frontend

Buka terminal baru:

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
npm install
npm run dev
```

Expected output:
```
VITE v6.2.0  ready in XXX ms

➜  Local:   http://localhost:5173/
```

### Terminal 3: Open Browser

```bash
http://localhost:5173
```

---

## 🔧 **CARA 3: Dengan Real Hyperledger Fabric**

### Prerequisite: Setup Hyperledger Fabric

Ikuti panduan di: `HYPERLEDGER_FABRIC_SETUP.md`

1. Download Fabric samples
2. Start test-network
3. Deploy chaincode

### Verify Fabric is Running

```bash
docker ps
```

Anda harus lihat containers:
- `orderer.example.com`
- `peer0.org1.example.com`
- `peer0.org2.example.com`
- `fabric-ca_...`

### Run Real Mode

```bash
run-real.bat
```

---

## 🎯 Apa yang Bisa Anda Test

### Login
- Username: `doctor`
- Password: `1234`
- Role: `Dokter`

### Fungsi-Fungsi:
1. **Rekam Baru** - Buat medical record baru
2. **Daftar Pasien** - Lihat list pasien
3. **Laporan** - View records dengan Fabric TX ID
4. **Dashboard** - Overview data

### Test Blockchain:
1. Buat record baru
2. Perhatikan "Fabric TX ID" di Laporan
3. Klik icon 🔗 untuk lihat transaction history
4. Modal akan menampilkan:
   - Transaction ID
   - Timestamp
   - Data Hash
   - Status

---

## ⚠️ Troubleshooting

### Error: "npm: command not found"
**Solution**: Node.js belum terinstall
- Download: https://nodejs.org/
- Install dan restart terminal

### Error: "Port 4000 already in use"
**Solution**: Ada process lain yang pakai port
```bash
netstat -ano | findstr :4000
taskkill /PID [PID_NUMBER] /F
```

### Error: "Cannot find module"
**Solution**: Dependencies belum diinstall
```bash
cd folder
npm install
```

### Error: "Fabric network not running" (Real Mode)
**Solution**: Start Fabric network dulu
```bash
cd fabric-samples/test-network
./network.sh up createChannel -c medchannel
```

### React app tidak bisa connect ke API
**Solution**: Check .env.local sudah benar
```
VITE_API_URL=http://localhost:4000/api
```

---

## 🔍 Debug Mode

Untuk melihat lebih detail:

### Backend - Dengan DEBUG
```bash
DEBUG=* npm start
```

### Frontend - Browser Console
```
F12 → Console tab
```

Anda akan lihat log untuk setiap action

---

## 📊 Struktur File yang Di-Run

```
Medchain/
├── setup.bat ← Run ini untuk install dependencies
├── run-mock.bat ← Run ini untuk testing (no Fabric)
├── run-real.bat ← Run ini dengan real Fabric
│
├── national-health-record-ledger/
│   └── off-chain/api-gateway/
│       ├── .env ← Configuration
│       ├── index.js ← Backend entry point
│       ├── node_modules/ ← Dependencies
│       └── src/
│
└── legacy_prototype/
    ├── .env.local ← Configuration
    ├── index.html ← Entry point
    ├── package.json
    ├── node_modules/ ← Dependencies
    └── src/
```

---

## 🎬 Workflow Setelah Run

```
Browser (localhost:5173)
    ↓
React App (legacy_prototype)
    ↓
API Calls to localhost:4000
    ↓
Backend API (api-gateway)
    ↓
Mock Fabric OR Real Fabric
    ↓
Results back to browser
```

---

## 📝 Konfigurasi Penting

### Backend (.env)
```
BLOCKCHAIN_MODE=MOCK          # MOCK atau REAL
PORT=4000                      # Backend port
FABRIC_CHANNEL_NAME=medchannel
FABRIC_CHAINCODE_NAME=medrecords
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:4000/api
```

---

## 🎯 Next Steps Setelah Testing

1. **Test dengan MOCK dulu** - Memastikan aplikasi jalan
2. **Setup Hyperledger Fabric** - Follow HYPERLEDGER_FABRIC_SETUP.md
3. **Deploy Chaincode** - Gunakan template dari setup guide
4. **Switch ke REAL mode** - Ubah BLOCKCHAIN_MODE=REAL
5. **Test dengan Real Fabric** - Jalankan run-real.bat

---

## ✅ Success Indicators

Ketika berhasil, Anda akan lihat:

✅ **Backend**:
```
API Gateway listening at http://localhost:4000
```

✅ **Frontend**:
```
VITE v6.2.0  ready in XXX ms
Local:   http://localhost:5173/
```

✅ **Browser**:
- Login screen tampil
- Tidak ada error di console
- Buttons bisa diklik
- Data bisa ditampilkan

---

## 🎓 Tips

1. **Jangan close terminal** - Anda perlu keduanya running
2. **Baca logs** - Jika error, lihat output terminal
3. **Check ports** - Pastikan 4000 dan 5173 tidak dipakai
4. **Refresh browser** - Ctrl+Shift+R untuk hard refresh

---

**Siap? Mari mulai! Jalankan `setup.bat` sekarang! 🚀**
