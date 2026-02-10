# 🚀 Panduan Menjalankan Project MedicalChain (End-to-End)

Panduan ini mencakup langkah-langkah untuk menjalankan seluruh sistem MedicalChain dari nol, termasuk infrastruktur, backend, frontend, dan integrasi MetaMask.

## 📋 Prasyarat

Pastikan software berikut sudah terinstall:
- **Node.js** (v16+) & **npm**
- **Docker** & **Docker Compose** (Pastikan Docker Desktop running)
- **MetaMask** (Extension Browser)
- **Git**

---

## 🏗️ Step 1: Jalankan Infrastruktur (Database & Blockchain)

Kita akan menggunakan Docker untuk Database PostgreSQL. Untuk Blockchain Ganache, direkomendasikan menggunakan Docker di WSL untuk menghindari masalah koneksi.

### 1. Start PostgreSQL
```bash
cd ~/MedicalChain/national-health-record-ledger/docker
# Jika ada error network sebelumnya, bersihkan dulu:
docker-compose down 
docker network prune -f

# Jalankan PostgreSQL
docker-compose up -d postgres
```

### 2. Start Ganache (Blockchain Lokal)
Jalankan Ganache di terminal terpisah (biarkan running):

```bash
# Install Ganache CLI global (jika belum)
npm install -g ganache

# Jalankan Ganache dengan mnemonic tetap (agar address tidak berubah)
ganache --host 0.0.0.0 --chain.chainId 1337 -a 10 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
```
*Catatan: Mnemonic ini akan menghasilkan address yang sama setiap kali dijalankan.*

---

## 📜 Step 2: Deploy Smart Contract

Deploy contract `MedicalDataRequest` ke jaringan Ganache lokal.

Buka **Terminal Baru (WSL)**:
```bash
cd ~/MedicalChain/national-health-record-ledger/on-chain/ethereum

# Set URL Ganache (ke localhost WSL)
export GANACHE_URL=http://127.0.0.1:8545

# Deploy Contract
npx hardhat run scripts/deploy_MedicalDataRequest.js --network ganache
```

**PENTING:**
1. Salin **Contract Address** yang muncul di output (contoh: `0x...`).
2. Salin salah satu **Private Key** dari output Ganache (atau gunakan Mnemonic untuk import ke MetaMask).

---

## ⚙️ Step 3: Jalankan Backend (API Gateway)

Konfigurasi dan jalankan backend API.

### 1. Setup Environment Variables
```bash
cd ~/MedicalChain/national-health-record-ledger/off-chain/api-gateway

# Copy example env jika belum ada
cp .env.example .env
```

Edit `.env` dan pastikan konfigurasi berikut benar:
```env
# Database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=medchain
PG_USER=medchain
PG_PASSWORD=medchain123

# Blockchain
ETH_RPC_URL=http://127.0.0.1:8545
# Update dengan Contract Address dari Step 2!
DATA_REQUEST_CONTRACT_ADDRESS=0x[CONTRACT_ADDRESS_BARU]
```

### 2. Install & Run
```bash
npm install
npm run dev
```
*Backend akan berjalan di `http://localhost:3001` (atau port lain sesuai config).*

---

## 💻 Step 4: Jalankan Frontend (React)

Buka **Terminal Baru (WSL)**:

```bash
cd ~/MedicalChain/legacy_prototype

# Install dependencies (termasuk ethers)
npm install
npm install ethers@^6.0.0

# Run Frontend
npm run dev
```
*Frontend akan berjalan di `http://localhost:3000` atau `http://localhost:5173`.*

---

## 🦊 Step 5: Konfigurasi MetaMask

1. **Buka Browser** (Chrome/Edge) yang memiliki MetaMask.
2. **Tambah Network Ganache Local:**
   - **Network Name:** Ganache Local
   - **RPC URL:** `http://localhost:8545` (Browser bisa akses localhost WSL)
   - **Chain ID:** `1337`
   - **Currency Symbol:** ETH
3. **Import Account:**
   - Ambil **Private Key** dari terminal Ganache (Step 1.2).
   - Di MetaMask: Klik Profile -> Import Account -> Paste Private Key.
   - Pastikan saldo ~100 ETH.

---

## 🔄 Step 6: Update Frontend Config

Pastikan frontend menggunakan Contract Address yang baru dideploy.

1. Buka file: `~/MedicalChain/legacy_prototype/services/useMetaMask.ts`
2. Update variabel `CONTRACT_ADDRESS`:
   ```typescript
   const CONTRACT_ADDRESS = "0x[CONTRACT_ADDRESS_DARI_STEP_2]";
   ```
3. Save file (Frontend akan auto-reload).

---

## ✅ Step 7: Testing Flow Two-Step Approval

1. **Login** ke Frontend sebagai RS-B (Requester).
2. Buka Menu **Patient Directory** atau **Access Requests**.
3. **Connect Wallet** (Pilih akun RS-B di MetaMask).
4. Buat **Request Data** ke RS-A.
   - MetaMask Popup: **Confirm Transaction** (Bayar Gas).
5. **Login** sebagai RS-A (Target).
   - Buka **Access Requests**.
   - Klik **Approve**.
   - (Tidak ada gas fee, status jadi `APPROVED_PENDING`).
6. **Login** kembali sebagai RS-B.
   - Buka **Access Requests**.
   - Klik **Confirm Approval**.
   - MetaMask Popup: **Confirm Transaction** (Bayar Gas).
   - Status menjadi `APPROVED`.

Selesai! Sistem berjalan penuh.
