# 🎬 VISUAL GUIDE: Apa & Dimana Dijalankan

## 📊 SIMPLE DIAGRAM

```
MEDCHAIN PROJECT
│
├─ BACKEND (api-gateway)
│  ├─ Folder: ...national-health-record-ledger\off-chain\api-gateway
│  ├─ Command: npm start
│  ├─ Port: 4000
│  └─ Output: "API Gateway listening at 4000" ✅
│
├─ FRONTEND (legacy_prototype)
│  ├─ Folder: ...Medchain\legacy_prototype
│  ├─ Command: npm run dev
│  ├─ Port: 5173
│  └─ Output: "VITE ready in XXX ms" ✅
│
└─ BROWSER
   ├─ URL: http://localhost:5173
   ├─ Shows: Login Screen
   └─ Status: Works! ✅
```

---

## 🚀 EXECUTION FLOW

```
START
  │
  ├─→ [TERMINAL 1]
  │   │
  │   ├─→ Navigate: api-gateway
  │   │
  │   ├─→ Command: npm start
  │   │
  │   └─→ ✅ Wait: "listening at 4000"
  │
  ├─→ [TERMINAL 2]
  │   │
  │   ├─→ Navigate: legacy_prototype
  │   │
  │   ├─→ Command: npm run dev
  │   │
  │   └─→ ✅ Wait: "VITE ready"
  │
  └─→ [BROWSER]
      │
      ├─→ URL: http://localhost:5173
      │
      └─→ ✅ Login Screen


SUCCESS! ✅
```

---

## 📍 FOLDER TREE

```
D: Drive
│
└─ UNIKOM
   │
   └─ Semester 7
      │
      └─ Blockchain
         │
         └─ New folder
            │
            └─ Medchain ← START HERE
               │
               ├─ 📂 national-health-record-ledger
               │  │
               │  └─ off-chain
               │     │
               │     └─ api-gateway ← RUN "npm start" HERE
               │
               └─ 📂 legacy_prototype ← RUN "npm run dev" HERE
```

---

## 📋 COMMANDS AT A GLANCE

```
COMMAND 1: Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Folder:  api-gateway
Command: npm start
Result:  Port 4000 running ✅


COMMAND 2: Frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Folder:  legacy_prototype
Command: npm run dev
Result:  Port 5173 running ✅


ACCESS:  Browser
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL:     http://localhost:5173
Result:  Login screen ✅
```

---

## 🖥️ DESKTOP LAYOUT

```
┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┓
┃  TERMINAL 1     ┃  TERMINAL 2     ┃
┃                 ┃                 ┃
┃ api-gateway     ┃ legacy_prototype┃
┃ npm start       ┃ npm run dev     ┃
┃ Port 4000 ✅    ┃ Port 5173 ✅    ┃
┣━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┫
┃                                   ┃
┃          BROWSER WINDOW           ┃
┃          localhost:5173 ✅        ┃
┃                                   ┃
┃      [ MedChain Login ]           ┃
┃      Username: doctor             ┃
┃      Password: 1234               ┃
┃      [ LOGIN BUTTON ]             ┃
┃                                   ┃
└───────────────────────────────────┘
```

---

## ⏱️ TIMING

```
T=0:00  │ Open Terminal 1
        │
T=0:10  │ Run: npm start (backend)
        │
T=0:20  │ Waiting for: "API Gateway listening at 4000"
        │
T=0:30  │ ✅ Backend Ready
        │
T=1:00  │ Open Terminal 2
        │
T=1:10  │ Run: npm run dev (frontend)
        │
T=1:20  │ Waiting for: "VITE ready"
        │
T=1:30  │ ✅ Frontend Ready
        │
T=2:00  │ Open Browser
        │
T=2:10  │ Go to: http://localhost:5173
        │
T=2:20  │ ✅ Login Screen Appears!


TOTAL TIME: ~2.5 minutes
```

---

## 📝 COPY-PASTE READY

### Backend Command (Terminal 1):
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway && npm start
```

### Frontend Command (Terminal 2):
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype && npm run dev
```

### Browser:
```
http://localhost:5173
```

---

## ✅ VERIFICATION

```
TERMINAL 1: ✅ 
├─ Shows: "API Gateway listening at 4000"
└─ Status: Running (cursor blinking)

TERMINAL 2: ✅
├─ Shows: "VITE v6.2.0 ready in XXX ms"
├─ Shows: "Local: http://localhost:5173/"
└─ Status: Running (cursor blinking)

BROWSER: ✅
├─ URL: http://localhost:5173
├─ Shows: Login Screen
└─ Status: No 404 error
```

---

## 🎯 SUMMARY

| Component | Folder | Command | Port | Status |
|-----------|--------|---------|------|--------|
| Backend | api-gateway | npm start | 4000 | ✅ |
| Frontend | legacy_prototype | npm run dev | 5173 | ✅ |
| Browser | N/A | localhost:5173 | N/A | ✅ |

---

## 📌 KEY POINTS

1. **2 Terminals** - Harus buka 2 command prompt terpisah
2. **2 Commands** - npm start & npm run dev
3. **2 Ports** - 4000 & 5173
4. **Don't Close** - Jangan close terminal sampai selesai test
5. **Browser Last** - Akses browser paling akhir setelah keduanya running

---

**READY? LET'S GO! 🚀**
