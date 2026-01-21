# 🚨 TROUBLESHOOTING: localhost:5173 - 404 Error

## ❌ ERROR: "Cannot GET /" atau "404 Not Found"

Ini berarti Vite development server tidak berjalan dengan baik.

---

## 🔍 **DIAGNOSIS CHECKLIST**

### Step 1: Cek Terminal React

Lihat Terminal 2 (Frontend) - apakah ada error?

```
✅ GOOD: Anda akan lihat:
   VITE v6.2.0  ready in 234 ms
   ➜  Local:   http://localhost:5173/
   ➜  press h to show help

❌ BAD: Anda akan lihat error messages
   ERROR [plugin vite]
   Cannot find module...
   [ERR_MODULE_NOT_FOUND]
   etc
```

---

### Step 2: Cek Backend Terminal

Lihat Terminal 1 (Backend) - apakah running?

```
✅ GOOD: Anda akan lihat:
   API Gateway listening at http://localhost:4000
   --- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---

❌ BAD: Terminal tidak menunjukkan output ini
   atau ada ERROR messages
```

---

## 🛠️ **SOLUSI BERDASARKAN ERROR**

---

## **SOLUSI 1: npm run dev Belum Dijalankan**

### Cek:
- Apakah anda sudah buka Terminal 2?
- Apakah sudah jalankan `npm run dev`?

### Fix:

```bash
# Terminal 2 (buka baru jika belum ada)
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# Cek apakah node_modules ada
dir node_modules

# Jika tidak ada, install:
npm install

# Jalankan:
npm run dev
```

**Tunggu sampai output:**
```
VITE v6.2.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## **SOLUSI 2: npm install Tidak Selesai**

### Cek:
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# Apakah folder node_modules ada?
dir
```

Jika tidak ada `node_modules`, artinya npm install belum berhasil.

### Fix:

```bash
# Hapus cache
npm cache clean --force

# Install ulang
npm install

# Jika masih error, coba:
npm install --legacy-peer-deps

# Atau hapus dan install dari awal:
del node_modules
del package-lock.json
npm install
```

**Tunggu sampai selesai (bisa 10 menit)**

Verifikasi:
```
added XXX packages
```

---

## **SOLUSI 3: Port 5173 Sudah Dipakai**

### Cek:
Lihat di Terminal 2, apakah ada pesan:

```
EADDRINUSE: address already in use :::5173
```

### Fix:

**Option 1: Ganti port**
```bash
npm run dev -- --port 5174
```

Kemudian akses:
```
http://localhost:5174
```

**Option 2: Kill process yang pakai port 5173**

Terminal baru:
```bash
netstat -ano | findstr :5173
```

Output:
```
TCP    127.0.0.1:5173    0.0.0.0:0    LISTENING    12345
```

Copy nomor PID (12345) dan kill:
```bash
taskkill /PID 12345 /F
```

Kemudian jalankan ulang:
```bash
npm run dev
```

---

## **SOLUSI 4: Error di Terminal 2 (npm run dev failed)**

### Cek error message:

```
❌ "Cannot find module 'vite'"
✅ Fix: npm install

❌ "SyntaxError in src/..."
✅ Fix: Cek file ada typo? 
   Lihat error detail di terminal
   Fix typo, save, browser auto-reload

❌ "[ERR_MODULE_NOT_FOUND]"
✅ Fix: npm install --legacy-peer-deps
```

---

## **SOLUSI 5: Browser Buka Tapi Blank**

### Cek:
1. Terminal 2 running dengan baik? ✅
2. Port 5173 benar? ✅
3. Refresh browser: `Ctrl+Shift+R` ← Hard refresh!

### Fix:

```bash
# Terminal 2 - Stop server
Ctrl+C

# Clear cache
npm cache clean --force

# Jalankan ulang
npm run dev
```

Refresh browser: `Ctrl+Shift+R`

---

## **SOLUSI 6: node_modules Corrupt/Error**

### Gejala:
- npm install error
- Module not found errors
- Strange behavior

### Fix: Total Reset

```bash
# Terminal 2
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# Stop (jika ada)
Ctrl+C

# Hapus everything
del node_modules /s /q
del package-lock.json

# Clear npm cache
npm cache clean --force

# Install fresh
npm install

# Jalankan
npm run dev
```

---

## **SOLUSI 7: Backend Tidak Running**

Meskipun error 404 di port 5173, cek juga backend!

### Cek Terminal 1:
```
✅ GOOD: API Gateway listening at 4000
❌ BAD: Terminal 1 error atau tidak running
```

### Fix:

```bash
# Terminal 1
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway

# Stop (Ctrl+C)

# Cek .env ada:
type .env

# Install:
npm install

# Jalankan:
npm start
```

---

## **SOLUSI 8: Gunakan run-mock.bat**

Jika manual tidak work, coba otomatis:

```bash
# Folder root Medchain
run-mock.bat
```

Ini akan:
- ✅ Automatically buka Terminal 1 (Backend)
- ✅ Automatically buka Terminal 2 (Frontend)
- ✅ Automatically buka browser
- ✅ Lebih handal

---

## 🎯 **STEP-BY-STEP DEBUGGING**

### Step 1: Identify Problem

Lihat Terminal 2, ada error apa?

```
Copy error message
Search di Google: "[error message] vite"
```

### Step 2: Check Frontend

```bash
cd legacy_prototype
npm install
npm run dev
```

Tunggu output:
```
✓ VITE ready in XXX ms
✓ Local: http://localhost:5173/
```

### Step 3: Check Backend

Terminal baru:
```bash
cd api-gateway
npm start
```

Tunggu output:
```
✓ API Gateway listening at 4000
```

### Step 4: Test

Browser:
```
http://localhost:5173
```

### Step 5: Verify

- [ ] Terminal 1: API running
- [ ] Terminal 2: VITE ready
- [ ] Browser: Can access 5173
- [ ] No red errors

---

## 📊 **QUICK CHECKLIST**

| Check | How | Result |
|-------|-----|--------|
| **Backend Running?** | Terminal 1 output | Should say "listening at 4000" |
| **Frontend Running?** | Terminal 2 output | Should say "VITE ready" |
| **Port 5173 Free?** | netstat -ano \| findstr :5173 | No output = free |
| **node_modules Exists?** | ls node_modules | Should list packages |
| **Browser Can Connect?** | http://localhost:5173 | Should not be 404 |

---

## 🚀 **NUCLEAR OPTION (Total Reset)**

Jika semua tidak work:

```bash
# 1. Stop everything (Ctrl+C di semua terminal)

# 2. Delete everything
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain

# Backend
cd national-health-record-ledger\off-chain\api-gateway
del node_modules /s /q
del package-lock.json

# Frontend
cd ..\..\..\legacy_prototype
del node_modules /s /q
del package-lock.json

# 3. Clear npm cache
npm cache clean --force

# 4. Setup fresh
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain
setup.bat

# 5. Run
run-mock.bat
```

---

## 💡 **PRO TIPS**

1. **Always keep both terminals open**
   - Backend Terminal 1
   - Frontend Terminal 2

2. **Check terminal output first**
   - 90% of errors show in terminal
   - Not in browser

3. **Hard refresh browser**
   - Ctrl+Shift+R (not just F5)
   - Clears cache

4. **Port conflicts**
   - Kill old processes
   - Or use different port

5. **npm cache**
   - Clear if issues: `npm cache clean --force`
   - Helps 50% of the time

---

## 📞 **STILL NOT WORKING?**

Share with me:

1. **Screenshot of Terminal 1 output**
   - What does it say?
   - Any errors?

2. **Screenshot of Terminal 2 output**
   - What does it say?
   - Any errors?

3. **Browser error**
   - 404 Not Found?
   - Connection refused?
   - Something else?

4. **Logs from running:**
   ```bash
   npm run dev 2>&1 > vite-error.txt
   # Copy contents of vite-error.txt
   ```

---

## 🎯 **MOST COMMON CAUSES**

| Cause | Solution |
|-------|----------|
| npm run dev not running | Run it! |
| node_modules missing | npm install |
| Port 5173 in use | Kill process or use different port |
| npm install failed | npm cache clean --force && npm install |
| Backend not running | Check Terminal 1, run npm start |
| Browser cache | Ctrl+Shift+R |
| Firewall | Allow Node.js in Windows Firewall |

---

**Coba solusi-solusi di atas! Mana yang applicable untuk error Anda?**

**Atau share error message yang Anda lihat, saya bantu debug! 🚀**
