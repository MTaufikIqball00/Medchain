# Hyperledger Explorer Setup Guide

## Overview

Hyperledger Explorer adalah blockchain explorer untuk melihat transaksi, block, dan aktivitas di jaringan Hyperledger Fabric secara visual melalui browser.

---

## Quick Start

```bash
# Dari direktori scripts
cd ~/MedicalChain/national-health-record-ledger/scripts
chmod +x start_explorer.sh
./start_explorer.sh
```

Setelah running, buka: **http://localhost:8080**

**Login:**
- Username: `exploreradmin`
- Password: `exploreradminpw`

---

## Manual Start

```bash
cd ~/MedicalChain/national-health-record-ledger/docker

# Start Explorer
docker-compose -f docker-compose.explorer.yml up -d

# Check status
docker ps | grep explorer

# View logs
docker logs medchain-explorer -f
```

---

## Yang Bisa Dilihat di Explorer

| Menu | Deskripsi |
|------|-----------|
| **Dashboard** | Overview jumlah block, transaksi, nodes |
| **Network** | Topologi jaringan (peers, orderer) |
| **Blocks** | Daftar semua block dengan detail |
| **Transactions** | Semua transaksi dengan TX ID, timestamp |
| **Chaincodes** | Smart contract yang di-deploy |
| **Channels** | Channel yang aktif (medchannel) |

---

## Screenshot Preview

Setelah login, Anda akan melihat:

```
┌─────────────────────────────────────────────────────────────┐
│  HYPERLEDGER EXPLORER                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Dashboard                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ BLOCKS   │  │   TXS    │  │  NODES   │  │ CHAINCODE│    │
│  │   152    │  │   487    │  │    3     │  │    2     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  📈 Transaction History (Last 24h)                          │
│  ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇                                 │
│                                                              │
│  📋 Recent Transactions                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TX ID: abc123... | Time: 09:25:00 | Chaincode: medrc │   │
│  │ TX ID: def456... | Time: 09:24:55 | Chaincode: medrc │   │
│  │ TX ID: ghi789... | Time: 09:24:50 | Chaincode: medrc │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Stop Explorer

```bash
cd ~/MedicalChain/national-health-record-ledger/docker
docker-compose -f docker-compose.explorer.yml down
```

---

## Troubleshooting

### Explorer tidak bisa connect ke Fabric

```bash
# Pastikan Fabric network running
docker-compose -f docker-compose.yml up -d

# Cek network
docker network ls | grep medchain
```

### Database error

```bash
# Restart Explorer database
docker-compose -f docker-compose.explorer.yml down
docker volume rm docker_explorer_pgdata
docker-compose -f docker-compose.explorer.yml up -d
```

### Tidak ada transaksi muncul

1. Pastikan sudah ada transaksi di Fabric
2. Cek channel name sesuai (medchannel)
3. Refresh browser

---

## Prerequisite

- Docker & Docker Compose
- Hyperledger Fabric network running
- crypto-config dengan admin credentials

---

## File Konfigurasi

| File | Fungsi |
|------|--------|
| `docker-compose.explorer.yml` | Docker config untuk Explorer |
| `explorer-config/config.json` | Konfigurasi utama Explorer |
| `explorer-config/connection-profile/medchain-network.json` | Koneksi ke Fabric network |
