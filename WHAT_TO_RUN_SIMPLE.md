# 🎯 ULTRA SIMPLE: Apa Dijalankan & Dimana

## RINGKAS BANGET:

Anda perlu jalankan 2 command di 2 tempat berbeda.

---

## 📍 TEMPAT 1: Backend (api-gateway)

### Folder:
```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\
national-health-record-ledger\off-chain\api-gateway
```

### Command:
```bash
npm start
```

### Expected:
```
API Gateway listening at http://localhost:4000
```

### Status:
```
✅ KEEP RUNNING (jangan close)
```

---

## 📍 TEMPAT 2: Frontend (legacy_prototype)

### Folder:
```
D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\
legacy_prototype
```

### Command:
```bash
npm run dev
```

### Expected:
```
VITE v6.2.0 ready in XXX ms
Local: http://localhost:5173/
```

### Status:
```
✅ KEEP RUNNING (jangan close)
```

---

## 🌐 BROWSER

### URL:
```
http://localhost:5173
```

### Expected:
```
Login Screen
Username: doctor
Password: 1234
```

---

## 📝 STEP-BY-STEP SUPER SIMPLE

### Terminal 1:
```
1. Open cmd (Win+R → cmd → Enter)
2. Paste: cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger\off-chain\api-gateway
3. Paste: npm start
4. TUNGGU: "listening at 4000"
5. JANGAN CLOSE
```

### Terminal 2:
```
1. Open cmd baru (Win+R → cmd → Enter)
2. Paste: cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
3. Paste: npm run dev
4. TUNGGU: "VITE ready"
5. JANGAN CLOSE
```

### Browser:
```
1. Open browser
2. Go to: http://localhost:5173
3. Login: doctor / 1234
```

---

## ✅ DONE!

Kalau semua sudah running:

```
✅ Terminal 1: Port 4000 running
✅ Terminal 2: Port 5173 running
✅ Browser: Login screen tampil
✅ Anda bisa login & test!
```

---

## ❌ JIKA 404 ERROR:

Terminal 2 belum running!

Jalankan:
```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
npm run dev
```

Tunggu sampai "VITE ready"

---

**THAT'S IT! JUST 2 COMMANDS! 🚀**
