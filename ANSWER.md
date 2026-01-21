# 🎊 JAWABAN: Cara Menjalankan Frontend (legacy_prototype)

## ✅ YA, Anda perlu `npm run dev` di folder legacy_prototype

---

## 📍 **Lokasi Folder:**

```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
```

---

## 🚀 **Ada 2 Cara Jalankan:**

### **CARA 1: PALING MUDAH (Recommended)**

Jalankan saja:
```bash
run-mock.bat
```

**Ini akan automatically:**
- ✅ Terminal 1: Backend (port 4000)
- ✅ Terminal 2: Frontend (port 5173)  
- ✅ Browser: Auto open ke http://localhost:5173
- ✅ Tidak perlu manual commands!

---

### **CARA 2: MANUAL (Jika perlu)**

#### Terminal 1 (Backend):
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
npm install
npm start
```
*(Keep this terminal open)*

#### Terminal 2 (Frontend):
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
npm install
npm run dev
```
*(Keep this terminal open)*

#### Browser:
```
http://localhost:5173
```

---

## 🎯 **Expected Output:**

### Terminal 1 (Backend):
```
API Gateway listening at http://localhost:4000
--- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---
```

### Terminal 2 (Frontend):
```
VITE v6.2.0  ready in 234 ms

➜  Local:   http://localhost:5173/
```

### Browser:
```
✅ Login screen tampil
✅ Username: doctor
✅ Password: 1234
```

---

## 📋 **Complete Commands (Manual Way):**

```bash
# STEP 1: Open Terminal
Win + R → cmd → Enter

# STEP 2: Go to backend folder
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway

# STEP 3: Install backend dependencies
npm install

# STEP 4: Start backend
npm start

# ❌ DON'T CLOSE THIS TERMINAL!

---

# STEP 5: Open ANOTHER terminal (keep Terminal 1 open!)
# Win + R → cmd → Enter

# STEP 6: Go to frontend folder
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# STEP 7: Install frontend dependencies
npm install

# STEP 8: Start frontend with npm run dev
npm run dev

# ❌ DON'T CLOSE THIS TERMINAL!

---

# STEP 9: Browser automatically opens
# If not, manually go to:
http://localhost:5173
```

---

## 🔍 **Apa yang `npm run dev` lakukan:**

```
npm run dev
  ↓
- Start Vite development server
- Watch for file changes
- Hot reload (auto refresh browser)
- Compile TypeScript/React
- Serve on http://localhost:5173
- Show logs in terminal
```

---

## 📂 **Folder Structure (legacy_prototype):**

```
legacy_prototype/
├── .env.local                  ← Config (created)
├── package.json                ← Scripts (including "dev": "vite")
├── vite.config.ts             ← Vite config
├── index.html                 ← Entry point
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── components/
│   │   ├── Reports.tsx        ← Modified (Fabric TX)
│   │   └── ...
│   └── services/
│       └── fabricService.ts   ← Modified (API calls)
└── node_modules/              ← Created by npm install
```

---

## ✅ **Success Checklist:**

When both terminals are running:

- [ ] Terminal 1 shows "API Gateway listening at 4000"
- [ ] Terminal 2 shows "VITE ready on 5173"  
- [ ] Browser window opens automatically
- [ ] Login screen visible
- [ ] No red errors in browser console (F12)
- [ ] Can type username & password

---

## 🎮 **Test After Running:**

1. **Login:**
   ```
   Username: doctor
   Password: 1234
   ```

2. **Create Record:**
   - Click "Rekam Baru"
   - Fill patient data
   - Click Submit

3. **View Reports:**
   - Click "Laporan"
   - See Fabric TX ID column ← NEW!
   - Click 🔗 icon
   - See transaction history modal

4. **Success!** ✅

---

## 🚨 **Troubleshooting:**

| Problem | Solution |
|---------|----------|
| npm: command not found | Install Node.js from nodejs.org |
| Port 4000 in use | Restart or kill process |
| Port 5173 in use | Different port or restart |
| Cannot find module | Run npm install again |
| Browser blank | Check Terminal 2 logs, hard refresh (Ctrl+Shift+R) |
| API not responding | Check Terminal 1 is running |

---

## 📊 **Architecture Diagram:**

```
        Terminal 1                Terminal 2                Browser
    ┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐
    │  Backend API    │◄────►│  Frontend React │◄────►│   App UI     │
    │  npm start      │      │  npm run dev    │      │ localhost:   │
    │  port 4000      │      │  port 5173      │      │  5173        │
    └─────────────────┘      └─────────────────┘      └──────────────┘
            ▲                                                   ▲
            │                                                   │
            └───────────────────────────────────────────────────┘
                      HTTP Requests/Responses
```

---

## 💡 **Key Points:**

1. **Two terminals needed** - Both must stay open
2. **Backend first** - Start api-gateway before React
3. **Frontend second** - Start legacy_prototype next
4. **Keep them running** - Don't close either terminal
5. **Browser will open** - Auto open to localhost:5173
6. **MOCK mode** - No Fabric needed for this testing
7. **Hot reload** - Edits auto-refresh in browser

---

## 🎯 **Quick Summary:**

**Q: Do I need `npm run dev` in legacy_prototype?**

**A: YES!**

```bash
# Backend folder:
npm start

# Frontend folder:
npm run dev    ← YES, you need this!

# Then access:
http://localhost:5173
```

---

## 📚 **Related Documentation:**

For more details, read these files:

- `SIMPLE_RUN.md` - Visual guide (recommended!)
- `FRONTEND_SETUP.md` - Frontend detailed guide
- `BACKEND_SETUP.md` - Backend detailed guide
- `RUNNING.md` - Complete running instructions
- `STEP_BY_STEP.md` - Step-by-step walkthrough

---

## 🚀 **READY? DO THIS:**

### Fastest Way:
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain
run-mock.bat
```

### Manual Way:
```bash
# Terminal 1:
cd api-gateway && npm install && npm start

# Terminal 2 (new):
cd legacy_prototype && npm install && npm run dev

# Browser:
http://localhost:5173
```

---

**That's it! `npm run dev` will start your React app! 🎉**
