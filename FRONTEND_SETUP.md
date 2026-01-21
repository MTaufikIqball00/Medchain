# 📱 Cara Menjalankan Frontend React (legacy_prototype)

## Ada 2 Cara:

---

## ✅ **CARA 1: Automatic (Recommended)**

### Jalankan script:
```bash
run-mock.bat
```

**Ini akan automatically:**
- ✅ Buka Terminal 1 - Backend API
- ✅ Buka Terminal 2 - Frontend React  
- ✅ Buka browser ke http://localhost:5173

**Tidak perlu manual commands!**

---

## ⚙️ **CARA 2: Manual (Jika Cara 1 Tidak Bekerja)**

### Terminal 1: Backend API

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway

npm install

npm start
```

**Expected Output:**
```
API Gateway listening at http://localhost:4000
Connected to Fabric (MOCK Mode)
```

**Jangan close terminal ini!**

---

### Terminal 2: Frontend React

**Buka terminal baru** (Ctrl+Shift+P atau File → New Terminal)

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

npm install

npm run dev
```

**Expected Output:**
```
VITE v6.2.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## 📍 Lokasi Folder

### Frontend Folder:
```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
```

### Folder structure di dalam:
```
legacy_prototype/
├── .env.local              ← Configuration (VITE_API_URL)
├── package.json            ← Dependencies list
├── package-lock.json
├── tsconfig.json
├── vite.config.ts          ← Vite config (port 5173)
├── index.html              ← Entry point
├── index.css
├── src/
│   ├── App.tsx             ← Main app
│   ├── index.tsx
│   ├── types.ts
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── RecordForm.tsx
│   │   ├── Reports.tsx     ← Modified (Fabric TX tracking)
│   │   └── ...
│   ├── services/
│   │   ├── fabricService.ts ← Modified (API calls)
│   │   ├── geminiService.ts
│   │   └── auditService.ts
│   └── utils/
├── node_modules/           ← Dependencies (created after npm install)
└── dist/                   ← Build output (created after npm run build)
```

---

## 🔍 Apa yang ada di `package.json`:

```json
{
  "name": "medchain:-ai-&-blockchain-medical-records",
  "scripts": {
    "dev": "vite",              ← Jalankan development server
    "build": "vite build",      ← Build untuk production
    "preview": "vite preview"   ← Preview build
  },
  "dependencies": {
    "react": "^18.3.1",
    "@google/genai": "^1.33.0",
    "lucide-react": "^0.560.0",
    "recharts": "^3.5.1"
    // NOTE: ethers.js REMOVED ✅
  }
}
```

---

## 🎯 Step-by-Step Manual (Kalau perlu):

### 1. Check Node.js
```bash
node --version
npm --version
```

Expected: v14+

### 2. Navigate ke folder
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
```

### 3. Install dependencies (first time only)
```bash
npm install
```

Ini akan download semua packages (bisa 2-5 menit)

Expected output ending with:
```
added XXX packages
```

### 4. Start development server
```bash
npm run dev
```

Expected output:
```
VITE v6.2.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 5. Open browser
```
http://localhost:5173
```

---

## ✅ Success Indicators

Ketika berhasil, Anda akan lihat:

### Terminal Output:
```
✓ VITE ready
✓ http://localhost:5173/
✓ No error messages
```

### Browser:
```
✓ Login screen tampil
✓ No console errors (F12)
✓ Page responsive
```

### Network:
```
✓ Can call API (check Network tab)
✓ API responses 200 OK
```

---

## 🚨 Troubleshooting

### Error: "Cannot find module"
```
❌ npm install belum selesai atau gagal
✅ Jalankan ulang: npm install
```

### Error: "Port 5173 already in use"
```
❌ Ada aplikasi lain pakai port 5173
✅ Jalankan di port lain:
   npm run dev -- --port 5174
```

### Error: "Cannot GET /"
```
❌ Vite server tidak jalan
✅ Cek terminal - ada error messages?
   Jalankan ulang: npm run dev
```

### API Calls Failed
```
❌ Backend API tidak jalan
✅ Cek Terminal 1 (Backend)
   Pastikan: npm start sudah running di port 4000
   Cek .env.local: VITE_API_URL=http://localhost:4000/api
```

### Blank Page / 404
```
❌ Vite tidak serve HTML
✅ Cek index.html di root folder
   Refresh browser: Ctrl+Shift+R
```

---

## 📝 Vite Configuration

File: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  }
})
```

Ini configure:
- ✅ Port: 5173
- ✅ Hot reload otomatis
- ✅ Fast refresh

---

## 🎮 Hot Reload (Auto Refresh)

Fitur terbaik Vite:

1. Edit file `.tsx` atau `.css`
2. **Automatic save & refresh** di browser
3. State preserved (tidak full reload)

Contoh:
```bash
# Terminal terus running dengan npm run dev
# Buka App.tsx di text editor
# Ubah text "Dashboard" menjadi "My Dashboard"
# Simpan file (Ctrl+S)
# Browser otomatis refresh - text berubah!
```

---

## 🔗 Backend-Frontend Integration

### Backend (Port 4000):
```
http://localhost:4000/api/fabric/...
```

### Frontend (Port 5173):
```
http://localhost:5173
```

### Komunikasi:
```
Frontend (React)
    ↓
    Fetch API to localhost:4000
    ↓
Backend (Express)
    ↓
Fabric (MOCK or REAL)
```

### Config (.env.local):
```
VITE_API_URL=http://localhost:4000/api
```

---

## 📊 Build & Production

### Development Mode (saat ini):
```bash
npm run dev
```
- ✅ Fast development
- ✅ Hot reload
- ✅ Full source maps
- ✅ Not optimized

### Production Build:
```bash
npm run build
```
- ✅ Minified & optimized
- ✅ Static files
- ✅ Can be deployed
- Creates `dist/` folder

### Preview Production Build:
```bash
npm run preview
```
- ✅ Preview production build locally

---

## 🎯 Complete Flow

```
┌─────────────────────────────────────┐
│ Terminal 1: Backend                 │
│ cd api-gateway                      │
│ npm start                           │
│ (port 4000)                         │
└────────────┬────────────────────────┘
             │
             ← → HTTP Requests
             │
┌────────────▼────────────────────────┐
│ Terminal 2: Frontend                │
│ cd legacy_prototype                 │
│ npm run dev                         │
│ (port 5173)                         │
└────────────┬────────────────────────┘
             │
             │ Browser opens
             │
┌────────────▼────────────────────────┐
│ http://localhost:5173               │
│ React App Running                   │
│ - Dashboard                         │
│ - Reports with Fabric TX           │
│ - etc...                           │
└─────────────────────────────────────┘
```

---

## 🎓 Environment Variables

### Backend (.env):
```
BLOCKCHAIN_MODE=MOCK
PORT=4000
```

### Frontend (.env.local):
```
VITE_API_URL=http://localhost:4000/api
```

**Sudah dibuat otomatis oleh setup.bat!**

Tapi bisa di-edit manual jika perlu.

---

## 💡 Tips

1. **Keep both terminals running**
   - Backend perlu jalan
   - Frontend perlu jalan
   - Jangan close salah satu

2. **Check console (F12)**
   - Browser DevTools sangat berguna
   - Lihat Network tab untuk API calls
   - Lihat Console tab untuk error

3. **Hard refresh**
   - Ctrl+Shift+R untuk clear cache
   - Jika ada perubahan tidak ketara

4. **Port conflicts**
   - Jika port 5173 sudah dipakai:
   - `npm run dev -- --port 5174`

5. **Node modules**
   - Jangan di-commit ke git
   - Sudah di-.gitignore

---

## ✅ Checklist

Sebelum menjalankan `npm run dev`:

- [ ] Node.js terinstall
- [ ] npm terinstall
- [ ] Backend running (Terminal 1)
- [ ] Current folder = legacy_prototype
- [ ] npm install sudah selesai
- [ ] .env.local ada
- [ ] Port 5173 tidak dipakai

---

## 🚀 Quick Reference

```bash
# Terminal 1 (Backend):
cd national-health-record-ledger\off-chain\api-gateway
npm install
npm start

# Terminal 2 (Frontend):
cd legacy_prototype
npm install
npm run dev

# Browser:
http://localhost:5173
```

---

**Siap? Jalankan `npm run dev` di legacy_prototype folder sekarang! 🚀**
