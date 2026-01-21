# 🔧 SOLUSI: Failed to save record Error

## ❌ MASALAH:
```
Error: "Failed to save record"
Dari: localhost:3001 (atau 4000)
Penyebab: Backend npm install BELUM DILAKUKAN!
```

---

## ✅ SOLUSI CEPAT:

### STEP 1: Stop Backend

Di Terminal 1 (Backend), tekan:
```
Ctrl + C
```

---

### STEP 2: Navigate ke Backend Folder

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
```

---

### STEP 3: Install Dependencies

```bash
npm install
```

**TUNGGU sampai selesai!** (bisa 5-10 menit)

Anda akan lihat:
```
added XXX packages
```

---

### STEP 4: Start Backend Ulang

```bash
npm start
```

Anda akan lihat:
```
API Gateway listening at http://localhost:4000
--- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---
```

---

### STEP 5: Test Ulang di Browser

1. Buka browser
2. Akses: http://localhost:5173
3. Login: doctor / 1234
4. Coba buat record baru
5. Klik Save

**Seharusnya berhasil sekarang! ✅**

---

## 📊 WHY THIS ERROR?

```
Backend tidak ada dependencies installed
  ↓
API tidak bisa process request
  ↓
Frontend send data tapi backend error
  ↓
"Failed to save record" ❌
```

---

## 🔍 VERIFICATION

Setelah npm install, cek apakah `node_modules` folder ada:

```bash
# Di folder api-gateway, jalankan:
dir

# Anda harus lihat:
node_modules  ← Folder ini harus ada!
```

---

## 📝 COMPLETE STEPS

### Terminal 1 (Backend):

```bash
# 1. Navigasi
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway

# 2. Stop (jika sudah running)
Ctrl + C

# 3. Install dependencies
npm install

# TUNGGU sampai "added XXX packages"

# 4. Start
npm start

# TUNGGU sampai "API Gateway listening at 4000"
```

### Terminal 2 (Frontend) - Sudah running:

```
Tidak perlu ganti apa-apa
Tetap jalan
```

### Browser:

```
Refresh: Ctrl + Shift + R
Go to: http://localhost:5173
Test: Create record
```

---

## ✨ EXPECTED RESULT

Setelah npm install:

```
✅ Backend: npm start berhasil
✅ Backend: Menampilkan "API Gateway listening at 4000"
✅ Browser: Bisa save record TANPA error
✅ Terminal 1: Menampilkan API logs saat save
```

---

## 🚨 JIKA MASIH ERROR:

Cek Terminal 1 output:

```
❌ "Cannot find module 'express'"
→ npm install belum berhasil
→ Ulangi: npm install

❌ "EADDRINUSE: address already in use :::4000"
→ Port 4000 sudah dipakai
→ Kill process: taskkill /PID [nomor] /F
→ Atau ganti port di .env

❌ "Error: Cannot find module 'fabric-network'"
→ npm install belum lengkap
→ Jalankan: npm install --legacy-peer-deps
```

---

## 💡 WHY npm install?

File `package.json` di api-gateway berisi list semua dependencies:

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "fabric-network": "^2.2.20",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5",
    ...
  }
}
```

Ketika Anda jalankan `npm install`:
- Download semua packages
- Create `node_modules` folder
- Backend bisa berjalan dengan baik

Tanpa `npm install`:
- Packages tidak ada
- Backend error saat run
- API calls gagal
- "Failed to save record" ❌

---

## 📋 CHECKLIST

Sebelum test save:

- [ ] Backend: npm install sudah done
- [ ] Backend: node_modules folder ada
- [ ] Backend: npm start sudah running
- [ ] Terminal 1: Menampilkan "listening at 4000"
- [ ] Terminal 2: Frontend masih running
- [ ] Browser: Sudah login
- [ ] Test: Coba save record

---

## 🎯 SUMMARY

```
Error: "Failed to save record"
  ↓
Penyebab: npm install belum dilakukan di backend
  ↓
Solusi: 
  1. cd api-gateway
  2. npm install (tunggu 10 menit)
  3. npm start
  ↓
Test: Buat record baru
  ↓
Result: ✅ SUCCESS!
```

---

**Jalankan npm install di backend sekarang dan error hilang! 🚀**
