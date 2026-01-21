# ✅ SOLUSI: Anda Belum Jalankan npm run dev!

## Masalah:
```
❌ localhost:5173 → 404 Error
✅ Penyebab: npm run dev di legacy_prototype belum dijalankan!
```

---

## 🚀 SOLUSI (4 LANGKAH MUDAH):

### **LANGKAH 1: Buka Command Prompt/Terminal Baru**

Tekan: `Win + R`
Ketik: `cmd`
Tekan: `Enter`

```bash
$ _
```

---

### **LANGKAH 2: Navigate ke legacy_prototype**

```bash
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype
```

Verifikasi dengan:
```bash
dir
```

Anda harus melihat:
```
.env.local
package.json
vite.config.ts
src/
index.html
...
```

---

### **LANGKAH 3: Jalankan npm run dev**

```bash
npm run dev
```

**TUNGGU sampai muncul ini:**

```
VITE v6.2.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

Ini akan memakan waktu 2-5 detik.

**PENTING: Jangan close terminal ini!**

---

### **LANGKAH 4: Buka Browser**

Akses:
```
http://localhost:5173
```

**Anda akan melihat:**
```
✅ Login Screen!
✅ Username field
✅ Password field
```

---

## 🎯 **LAYOUT AKHIR (Harus ada 2 Terminal!)**

```
┌─────────────────────────────────────┐
│  Terminal 1 (Backend)               │
│  $ npm start                        │
│  API Gateway listening at 4000      │
│  ✅ KEEP RUNNING                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Terminal 2 (Frontend) ← JALANKAN INI│
│  $ npm run dev                      │
│  VITE v6.2.0 ready in XXX ms       │
│  ➜  Local: http://localhost:5173/  │
│  ✅ KEEP RUNNING                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Browser                            │
│  http://localhost:5173              │
│  ✅ Login Screen Tampil!            │
└─────────────────────────────────────┘
```

---

## 📋 **CHECKLIST**

Setelah menjalankan semua:

- [ ] Terminal 1 berjalan (Backend)
- [ ] Terminal 2 berjalan (Frontend) ← YANG INI ANDA BELUM JALANKAN!
- [ ] Browser bisa akses 5173
- [ ] Login screen tampil
- [ ] Tidak ada 404 error

---

## 🎬 **SEKARANG LAKUKAN INI:**

```bash
# 1. Open new terminal
Win + R → cmd → Enter

# 2. Navigate
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\legacy_prototype

# 3. Check node_modules ada?
dir

# Jika tidak ada "node_modules", jalankan:
npm install

# 4. Run development server
npm run dev

# 5. TUNGGU sampai "VITE ready"

# 6. Buka browser:
http://localhost:5173
```

---

## ✨ SETELAH npm run dev JALAN:

```
✅ Terminal 2 akan terus menampilkan logs
✅ Ketika Anda edit file, auto-reload
✅ Jangan close terminal!
✅ Browser punya akses ke development server
```

---

## 🚀 DONE!

Setelah Anda jalankan `npm run dev` di Terminal 2, maka:

1. ✅ localhost:5173 akan TIDAK 404
2. ✅ Login screen akan tampil
3. ✅ Aplikasi MedChain siap dipakai!

---

**GO! Jalankan `npm run dev` di legacy_prototype sekarang! 🎉**
