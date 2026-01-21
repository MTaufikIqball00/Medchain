# 🎯 SIMPLE GUIDE: Run Backend + Frontend

## Scenario: Anda mau jalankan MANUAL

---

## 📋 Yang Anda Butuh

- 2 Terminal/Command Prompt windows
- Folder: `D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain`

---

## 🔄 Step-by-Step

### TERMINAL 1: Backend API
```
┌───────────────────────────────────────┐
│ Terminal 1 - BACKEND API              │
├───────────────────────────────────────┤
│                                       │
│ $ cd D:\UNIKOM\Semester 7\...         │
│   Medchain\national-health-record...  │
│   ledger\off-chain\api-gateway        │
│                                       │
│ $ npm install                         │
│   (tunggu 5-10 menit)                │
│   ↓ added XXX packages                │
│                                       │
│ $ npm start                           │
│   ↓ API Gateway listening at 4000    │
│   ↓ --- RUNNING IN MOCK MODE ---     │
│   ↓ Ready for requests                │
│                                       │
│ ❌ JANGAN CLOSE TERMINAL INI!         │
│                                       │
└───────────────────────────────────────┘
         │
         │ Keep running
         │ (biarkan di background)
         ▼
```

### TERMINAL 2: Frontend React

**Buka terminal baru** (biarkan Terminal 1 tetap terbuka)

```
┌───────────────────────────────────────┐
│ Terminal 2 - FRONTEND REACT           │
├───────────────────────────────────────┤
│                                       │
│ $ cd D:\UNIKOM\Semester 7\...         │
│   Medchain\legacy_prototype           │
│                                       │
│ $ npm install                         │
│   (tunggu 5-10 menit)                │
│   ↓ added XXX packages                │
│                                       │
│ $ npm run dev                         │
│   ↓ VITE ready in 234ms              │
│   ↓ Local: http://localhost:5173     │
│   ↓ press h to show help             │
│                                       │
│ ❌ JANGAN CLOSE TERMINAL INI!         │
│                                       │
└───────────────────────────────────────┘
         │
         ▼
    Browser opens automatically
         │
         ▼
```

### BROWSER: Access Application

```
┌───────────────────────────────────────┐
│ Browser                               │
├───────────────────────────────────────┤
│                                       │
│ URL: http://localhost:5173            │
│                                       │
│ ✅ Login Screen appears               │
│ ✅ Username: doctor                   │
│ ✅ Password: 1234                     │
│ ✅ Login & Test!                      │
│                                       │
└───────────────────────────────────────┘
```

---

## 🎯 Visual Layout (Saat Running)

```
┌─────────────────────────────────┐
│ Terminal 1 (Backend)            │
│ PORT: 4000                      │
│ Status: Running ✅              │
│ Output: Logs here               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Terminal 2 (Frontend)           │
│ PORT: 5173                      │
│ Status: Running ✅              │
│ Output: Dev server logs         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Browser Window                  │
│ URL: localhost:5173             │
│ Status: App loaded ✅           │
│ Content: MedChain UI            │
└─────────────────────────────────┘

        ↓ ↓ ↓
   
    All Connected!
    You can now:
    ✅ Login
    ✅ Create records
    ✅ View reports
    ✅ See Fabric TX ID
```

---

## 📊 Command Reference

| Action | Terminal 1 | Terminal 2 |
|--------|-----------|-----------|
| **Folder** | api-gateway | legacy_prototype |
| **Install** | npm install | npm install |
| **Start** | npm start | npm run dev |
| **Port** | 4000 | 5173 |
| **Running?** | Keep open | Keep open |
| **Stop** | Ctrl+C | Ctrl+C |

---

## ⏱️ Timeline

```
T=0min:    Start setup
T=5min:    Backend npm install done
T=10min:   Backend running on 4000
T=15min:   Frontend npm install done
T=20min:   Frontend running on 5173
T=21min:   Browser opens
T=22min:   You can login & test!

Total: ~22 minutes (first time)
Next time: ~2 minutes (already installed)
```

---

## 🎮 What You Can Do (After Both Running)

### 1. Navigate & Test
```
✅ Dashboard - See overview
✅ Rekam Baru - Create medical record
✅ Daftar Pasien - View patients
✅ Laporan - View reports with Fabric TX ID
✅ Click 🔗 - See transaction history
```

### 2. In Terminal 1 (Backend)
```
Monitor logs:
- API requests coming in
- Fabric operations
- Error messages (if any)
```

### 3. In Terminal 2 (Frontend)
```
Monitor logs:
- Hot reload on file changes
- Component renders
- API calls being made
```

### 4. In Browser Console (F12)
```
Monitor:
- Network requests
- JavaScript errors
- Component warnings
```

---

## ✅ FINAL CHECKLIST

Before running, verify:

- [ ] 2 Terminal windows ready
- [ ] Node.js installed
- [ ] npm installed
- [ ] Port 4000 free
- [ ] Port 5173 free
- [ ] Folder paths correct
- [ ] .env file exists (backend)
- [ ] .env.local file exists (frontend)

After running:

- [ ] Terminal 1: "API Gateway listening at 4000"
- [ ] Terminal 2: "VITE ready"
- [ ] Browser: Login screen visible
- [ ] F12 Console: No red errors
- [ ] Both terminals: No "ERROR" logs

---

## 🚨 If Something Goes Wrong

| Error | Check |
|-------|-------|
| "npm: command not found" | Node.js not installed |
| "Port 4000 in use" | Kill process or restart |
| "Cannot find module" | npm install not done |
| "Cannot connect to API" | Check Terminal 1 logs |
| "Blank page in browser" | Check Terminal 2 logs |

---

## 🎯 YOU'RE RUNNING!

When you see this, everything is working:

```
Terminal 1:
  ✓ API Gateway listening at http://localhost:4000
  
Terminal 2:
  ✓ Local: http://localhost:5173/
  
Browser:
  ✓ Login screen
  
Result:
  ✅ MEDCHAIN IS RUNNING! 🎉
```

---

## 🚀 Next: Test the App

```
1. Login: doctor / 1234
2. Create a record
3. View reports
4. Click Fabric TX ID icon
5. See transaction history modal
6. SUCCESS! 🎊
```

---

**Ready? Open Terminal 1 and let's go! 🚀**
