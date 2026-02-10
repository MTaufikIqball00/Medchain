# 🚀 Panduan Menjalankan Project MedicalChain (End-to-End)

Panduan ini mencakup langkah-langkah untuk menjalankan seluruh sistem MedicalChain dari nol, termasuk infrastruktur, Hyperledger Fabric, Ethereum, backend, frontend, dan integrasi MetaMask.

## 📋 Prasyarat

Pastikan software berikut sudah terinstall di **WSL (Ubuntu)**:
- **Node.js** (v16+) & **npm**
- **Docker** & **Docker Compose** (Pastikan Docker Desktop running)
- **Go** (v1.20+) — untuk compile chaincode Fabric
- **Git**
- **MetaMask** (Extension Browser - Chrome/Edge)

---

## 🏗️ Step 1: Bersihkan Environment (Jika Pernah Running)

```bash
# Stop semua container Docker
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker network prune -f
```

---

## 🔗 Step 2: Setup & Deploy Hyperledger Fabric Network

Script otomatis akan: generate crypto, buat channel, deploy chaincode, dan setup wallet.

```bash
cd ~/MedicalChain/national-health-record-ledger/scripts
chmod +x setup_fabric.sh
./setup_fabric.sh
```

**Script ini menjalankan 9 langkah otomatis:**

| Step | Proses | Deskripsi |
|------|--------|-----------|
| 0 | Download Binaries | Download `cryptogen`, `configtxgen`, `peer` |
| 1 | Generate Crypto | Membuat MSP certificates untuk orderer & 2 orgs |
| 2 | Channel Artifacts | Membuat genesis block & channel transaction |
| 3 | Start Docker | Menjalankan orderer, 2 peers, 2 CAs |
| 4 | Create Channel | Membuat channel `medchannel` & join peers |
| 5 | Deploy Chaincode | Package, install, approve, commit chaincode `medrecords` |
| 6 | Test Chaincode | Test invoke `InitLedger` dan `CreateMetadata` |
| 7 | Connection Profile | Generate `connection-org1.json` untuk API Gateway |
| 8 | Wallet | Membuat wallet identity `appUser` untuk API Gateway |

**Hasil yang diharapkan:**
```
✅ SETUP COMPLETE!
Channel:   medchannel
Chaincode: medrecords
Orderer:   localhost:7050
Peer Org1: localhost:7051
Peer Org2: localhost:9051
CA Org1:   localhost:7054
CA Org2:   localhost:8054
```

> **Tips:** Jika ingin jalankan step tertentu saja:
> ```bash
> ./setup_fabric.sh 3    # Hanya start Docker
> ./setup_fabric.sh 5    # Hanya deploy chaincode
> ```

---

## 🗄️ Step 3: Jalankan PostgreSQL

```bash
cd ~/MedicalChain/national-health-record-ledger/docker
docker-compose up -d postgres
```

Verifikasi:
```bash
docker ps | grep postgres
# Harus muncul: medchain-postgres
```

---

## ⛓️ Step 4: Jalankan Ganache (Ethereum Lokal)

Buka **terminal terpisah** (biarkan running):

```bash
# Install Ganache CLI (jika belum)
npm install -g ganache

# Jalankan Ganache dengan mnemonic tetap
ganache --host 0.0.0.0 --chain.chainId 1337 -a 10 \
  -m "test test test test test test test test test test test junk"
```

> Mnemonic ini menghasilkan address yang sama setiap kali dijalankan.

---

## 📜 Step 5: Deploy Smart Contract Ethereum

Buka **terminal baru**:

```bash
cd ~/MedicalChain/national-health-record-ledger/on-chain/ethereum

export GANACHE_URL=http://127.0.0.1:8545

npx hardhat run scripts/deploy_MedicalDataRequest.js --network ganache
```

**PENTING:** Salin **Contract Address** dari output (contoh: `0x...`).

---

## ⚙️ Step 6: Konfigurasi & Jalankan Backend (API Gateway)

### 1. Setup Environment Variables

```bash
cd ~/MedicalChain/national-health-record-ledger/off-chain/api-gateway
cp .env.example .env   # Jika belum ada
```

Edit `.env` dan pastikan konfigurasi berikut:

```env
# Server
PORT=4000
BLOCKCHAIN_MODE=REAL

# Database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=medicalchain
PG_USER=medchain
PG_PASSWORD=medchain123

# Hyperledger Fabric
FABRIC_CONNECTION_PROFILE_PATH=./connection-org1.json
FABRIC_CHANNEL_NAME=medchannel
FABRIC_CHAINCODE_NAME=medrecords
FABRIC_WALLET_PATH=./wallet
FABRIC_USER_ID=appUser

# Ethereum / Ganache
ETH_RPC_URL=http://127.0.0.1:8545
# Update dengan Contract Address dari Step 5!
DATA_REQUEST_CONTRACT_ADDRESS=0x[CONTRACT_ADDRESS_BARU]
```

### 2. Install & Run

```bash
npm install
npm run dev
```

Backend berjalan di `http://localhost:4000`.

---

## 💻 Step 7: Jalankan Frontend (React)

Buka **terminal baru**:

```bash
cd ~/MedicalChain/legacy_prototype

npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173` (atau `http://localhost:3000`).

---

## 🦊 Step 8: Konfigurasi MetaMask

1. **Buka Browser** (Chrome/Edge) yang memiliki MetaMask.
2. **Tambah Network Ganache Local:**
   - **Network Name:** Ganache Local
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** ETH
3. **Import Account:**
   - Ambil **Private Key** dari output Ganache (Step 4).
   - Di MetaMask: Klik Profile → Import Account → Paste Private Key.
   - Pastikan saldo ~100 ETH.

---

## 🔄 Step 9: Update Frontend Contract Address

1. Buka file: `~/MedicalChain/legacy_prototype/services/useMetaMask.ts`
2. Update variabel `CONTRACT_ADDRESS`:
   ```typescript
   const CONTRACT_ADDRESS = "0x[CONTRACT_ADDRESS_DARI_STEP_5]";
   ```
3. Save file (Frontend akan auto-reload).

---

## ✅ Step 10: Testing Flow Two-Step Approval

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

---

## 📊 Arsitektur Service

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│               (React - port 5173)                    │
│                  + MetaMask                          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                 API GATEWAY                          │
│              (Node.js - port 4000)                   │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Fabric   │  │  Ethereum    │  │  PostgreSQL   │  │
│  │ SDK      │  │  (ethers.js) │  │  (pg client)  │  │
│  └────┬─────┘  └──────┬───────┘  └───────┬───────┘  │
└───────┼───────────────┼──────────────────┼──────────┘
        │               │                  │
        ▼               ▼                  ▼
┌──────────────┐ ┌────────────┐  ┌─────────────────┐
│  Fabric      │ │  Ganache   │  │   PostgreSQL    │
│  Network     │ │  (8545)    │  │   (5432)        │
│ ┌──────────┐ │ └────────────┘  └─────────────────┘
│ │ Orderer  │ │
│ │ (7050)   │ │
│ ├──────────┤ │
│ │ Peer Org1│ │
│ │ (7051)   │ │
│ ├──────────┤ │
│ │ Peer Org2│ │
│ │ (9051)   │ │
│ └──────────┘ │
└──────────────┘
```

---

## 🛠️ Troubleshooting

### Port sudah dipakai
```bash
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker network prune -f
```

### Fabric: "core.yaml not found"
```bash
# Pastikan FABRIC_CFG_PATH mengarah ke folder config
export FABRIC_CFG_PATH=~/MedicalChain/national-health-record-ledger/config
```

### Fabric: "network not found"
Pastikan `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=docker_medchain-network` di `docker-compose.yml`.

### Reset Fabric dari Awal
```bash
cd ~/MedicalChain/national-health-record-ledger/scripts
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker network prune -f
./setup_fabric.sh
```

Selesai! Sistem berjalan penuh. 🎉
