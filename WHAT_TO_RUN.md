# 📋 SIMPLE GUIDE: Apa Dijalankan & Dimana

## 🎯 RINGKASAN SINGKAT

Anda perlu jalankan **2 command di 2 lokasi berbeda**:

| No | Di Folder | Command | Port |
|----|-----------|---------|------|
| 1 | api-gateway | `npm start` | 4000 |
| 2 | legacy_prototype | `npm run dev` | 5173 |

Keduanya harus berjalan BERSAMAAN!

---

## 📍 LOKASI FOLDER

### Folder 1 (Backend):
```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\
    └── national-health-record-ledger\
        └── off-chain\
            └── api-gateway\        ← FOLDER 1
```

### Folder 2 (Frontend):
```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\
    └── legacy_prototype\            ← FOLDER 2
```

---

## 🚀 COMMAND YANG DIJALANKAN

### COMMAND 1: Backend
```
npm start
```

Dimana: Di folder `api-gateway`

### COMMAND 2: Frontend
```
npm run dev
```

Dimana: Di folder `legacy_prototype`

---

## 📝 STEP-BY-STEP (Super Detail)

### TERMINAL 1 (Backend):

**Step 1a: Open Command Prompt**
```
Win + R
Ketik: cmd
Tekan: Enter
```

**Step 1b: Navigate ke folder api-gateway**
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
```

**Step 1c: Jalankan command**
```bash
npm start
```

**Step 1d: Tunggu output seperti ini:**
```
API Gateway listening at http://localhost:4000
--- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---
```

**JANGAN CLOSE TERMINAL INI!** Biarkan terus running!

---

### TERMINAL 2 (Frontend):

**Step 2a: Open Terminal BARU** (keep Terminal 1 tetap terbuka!)
```
Win + R
Ketik: cmd
Tekan: Enter
```

**Step 2b: Navigate ke folder legacy_prototype**
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
```

**Step 2c: Jalankan command**
```bash
npm run dev
```

**Step 2d: Tunggu output seperti ini:**
```
VITE v6.2.0  ready in 234 ms
➜  Local:   http://localhost:5173/
➜  press h to show help
```

**JANGAN CLOSE TERMINAL INI!** Biarkan terus running!

---

### BROWSER:

**Step 3a: Open browser**

Ketik di address bar:
```
http://localhost:5173
```

**Step 3b: Anda akan melihat:**
```
Login Screen
Username: doctor
Password: 1234
```

---

## 📊 VISUAL LAYOUT

```
DESKTOP ANDA:

┌────────────────────────────────────┐
│ TERMINAL 1 (Backend)               │
│ Folder: api-gateway                │
│ Command: npm start                 │
│ Port: 4000                         │
│ Status: ✅ Running                 │
│ Output:                            │
│ API Gateway listening at 4000      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ TERMINAL 2 (Frontend)              │
│ Folder: legacy_prototype           │
│ Command: npm run dev               │
│ Port: 5173                         │
│ Status: ✅ Running                 │
│ Output:                            │
│ VITE ready                         │
│ Local: http://localhost:5173/      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ BROWSER WINDOW                     │
│ URL: http://localhost:5173         │
│ Status: ✅ Login Screen            │
│ Content:                           │
│ Username: [_______]                │
│ Password: [_______]                │
└────────────────────────────────────┘
```

---

## ✅ CHECKLIST SEBELUM MULAI

Sebelum jalankan command, pastikan:

- [ ] Anda di folder yang benar
- [ ] node_modules folder ada (atau npm install sudah berhasil)
- [ ] .env file ada
- [ ] Port 4000 tidak dipakai (backend)
- [ ] Port 5173 tidak dipakai (frontend)

---

## 📋 FULL COPY-PASTE COMMANDS

### Terminal 1 - Backend (Copy-Paste):

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
npm install
npm start
```

Tunggu sampai: `API Gateway listening at 4000`

---

### Terminal 2 - Frontend (Copy-Paste):

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
npm install
npm run dev
```

Tunggu sampai: `VITE ready`

---

### Browser:

```
http://localhost:5173
```

---

## 📊 SUMMARY TABLE

| Item | Lokasi | Command | Output | Port |
|------|--------|---------|--------|------|
| **Backend** | api-gateway | `npm start` | "API Gateway listening at 4000" | 4000 |
| **Frontend** | legacy_prototype | `npm run dev` | "VITE ready in XXX ms" | 5173 |
| **Browser** | Any | Navigate to URL | Login screen | N/A |

---

## 🎯 FLOW DIAGRAM

```
1. BUKA TERMINAL 1
   └─→ cd api-gateway
   └─→ npm start
   └─→ TUNGGU "API Gateway listening at 4000"
   └─→ JANGAN CLOSE

       ↓

2. BUKA TERMINAL 2
   └─→ cd legacy_prototype
   └─→ npm run dev
   └─→ TUNGGU "VITE ready"
   └─→ JANGAN CLOSE

       ↓

3. BUKA BROWSER
   └─→ http://localhost:5173
   └─→ LOGIN SCREEN TAMPIL ✅
   └─→ Username: doctor, Password: 1234
```

---

## 🚨 IMPORTANT NOTES

1. **Keduanya harus running** - Kalau salah satu di-close, akan error
2. **npm install** - Jalankan dulu jika node_modules belum ada
3. **Port 4000 & 5173** - Jangan jalankan aplikasi lain di port ini
4. **Terminal harus tetap terbuka** - Jangan minimize atau close

---

## 🎓 PENJELASAN SETIAP COMMAND

### `npm install`
- Download semua dependencies dari internet
- Buat folder `node_modules`
- Hanya perlu jalankan 1x (first time)

### `npm start` (Backend)
- Jalankan Express server
- Listen di port 4000
- Siap terima API requests
- Jalankan 1x, terus berjalan sampai Ctrl+C

### `npm run dev` (Frontend)
- Jalankan Vite development server
- Listen di port 5173
- Watch file changes & auto-reload
- Jalankan 1x, terus berjalan sampai Ctrl+C

---

## ✨ EXPECTED TIMELINE

```
T=0min   : Anda buka Terminal 1
T=0.5min : Jalankan "npm start"
T=1min   : Backend siap di port 4000 ✅

T=1.5min : Anda buka Terminal 2
T=2min   : Jalankan "npm run dev"
T=2.5min : Frontend siap di port 5173 ✅

T=3min   : Anda buka browser
T=3.5min : http://localhost:5173 terbuka
T=4min   : Login screen tampil ✅

TOTAL: ~4 menit
```

---

## 🎯 QUICK REFERENCE

**Backend Folder:**
```
national-health-record-ledger\off-chain\api-gateway
```

**Frontend Folder:**
```
legacy_prototype
```

**Backend Command:**
```
npm start
```

**Frontend Command:**
```
npm run dev
```

**Browser:**
```
http://localhost:5173
```

---

## 📌 REMEMBER

```
JANGAN LUPA:
✅ Buka 2 terminal
✅ Terminal 1: npm start (di api-gateway)
✅ Terminal 2: npm run dev (di legacy_prototype)
✅ Keduanya harus tetap terbuka
✅ Baru akses browser setelah KEDUANYA running
```

---

**Sudah jelas? Mulai dari Terminal 1! 🚀**
