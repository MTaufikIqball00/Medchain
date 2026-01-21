# 🔧 QUICK FIX: localhost:5173 - 404 Error

## Masalah:
```
http://localhost:5173 membuka 404
atau "Cannot GET /"
```

---

## 🎯 QUICK FIXES (Coba satu per satu)

### **FIX 1: Terminal 2 (Frontend) Belum Jalan**

Lihat apakah ada Terminal 2 yang menjalankan `npm run dev`:

```bash
# Jika belum ada, buka Terminal baru:

# Navigate:
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# Jalankan:
npm run dev

# TUNGGU sampai muncul:
VITE v6.2.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

Kemudian akses browser lagi: `http://localhost:5173`

---

### **FIX 2: npm install Belum Selesai**

```bash
# Di folder legacy_prototype:

# Cek apakah node_modules ada:
dir

# Jika tidak ada "node_modules", jalankan:
npm install

# Tunggu selesai (5-10 menit)

# Kemudian:
npm run dev
```

---

### **FIX 3: Port 5173 Sudah Dipakai**

Lihat Terminal 2, apakah ada pesan:
```
EADDRINUSE: address already in use :::5173
```

Jika iya, jalankan dengan port berbeda:

```bash
npm run dev -- --port 5174
```

Kemudian akses: `http://localhost:5174`

---

### **FIX 4: Hard Reset**

```bash
# Terminal 2 - Stop (Ctrl+C)

# Clear cache:
npm cache clean --force

# Delete node_modules:
del node_modules /s /q

# Delete lock file:
del package-lock.json

# Install ulang:
npm install

# Jalankan:
npm run dev
```

---

### **FIX 5: Gunakan run-mock.bat (Paling Mudah)**

```bash
# Di folder root Medchain:
run-mock.bat
```

Ini akan automatically:
- ✅ Buka Terminal 1 (Backend)
- ✅ Buka Terminal 2 (Frontend)
- ✅ Buka browser ke 5173

---

## 📋 **VERIFICATION CHECKLIST**

Sebelum akses browser, pastikan semua ini ✅:

```
Terminal 1 (Backend):
  ☑ $ npm start
  ☑ Output: "API Gateway listening at 4000"
  ☑ No ERROR messages
  ☑ Still running (terminal still open)

Terminal 2 (Frontend):
  ☑ $ npm run dev
  ☑ Output: "VITE v6.2.0 ready in XXX ms"
  ☑ Output: "Local: http://localhost:5173/"
  ☑ No ERROR messages
  ☑ Still running (terminal still open)

Browser:
  ☑ http://localhost:5173
  ☑ No 404 error
  ☑ Login screen muncul

Windows:
  ☑ 2 terminal windows terbuka
  ☑ Tidak ada yang di-close
```

---

## 🚨 **COMMON ERRORS & FIXES**

### Error: "Cannot find module 'vite'"
```
❌ node_modules tidak ada
✅ Jalankan: npm install
```

### Error: "EADDRINUSE :::5173"
```
❌ Port 5173 sudah dipakai
✅ Jalankan: npm run dev -- --port 5174
```

### Error: "Cannot GET /"
```
❌ npm run dev belum jalan
✅ Terminal 2 harus menjalankan npm run dev
```

### Browser Blank/White
```
❌ Cache browser lama
✅ Refresh: Ctrl+Shift+R (bukan F5!)
```

### Network Error
```
❌ Backend tidak jalan
✅ Cek Terminal 1: npm start sudah jalan?
```

---

## 🎯 **STEP-BY-STEP MANUAL**

Jika masih tidak work, ikuti ini:

### Terminal 1:
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway

npm install

npm start
```

**JANGAN CLOSE!** Tunggu output:
```
API Gateway listening at http://localhost:4000
```

---

### Terminal 2 (Buka Terminal Baru):
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

npm install

npm run dev
```

**JANGAN CLOSE!** Tunggu output:
```
VITE v6.2.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### Browser:
```
http://localhost:5173
```

Should show: **Login Screen**

---

## ✅ **SUCCESS INDICATORS**

Ketika semuanya bekerja:

```
✅ Terminal 1: "API Gateway listening at 4000"
✅ Terminal 2: "VITE ready" dan "Local: 5173"
✅ Browser: Bisa akses 5173 tanpa error
✅ Login screen: Tampil dengan user field
✅ Console (F12): Tidak ada red error messages
```

---

## 🚀 **TRY NOW**

1. **Check if npm run dev is running**
   - Look for Terminal 2
   - Should show "VITE ready"

2. **If not, run it:**
   ```bash
   cd legacy_prototype
   npm run dev
   ```

3. **Wait for it to start**
   - Takes 2-3 seconds usually

4. **Refresh browser**
   - Ctrl+Shift+R (hard refresh)

5. **Access:**
   - http://localhost:5173

**Let me know what error appears in Terminal 2!**

---

**Share the exact error message from Terminal 2, and I can help you faster! 🚀**
