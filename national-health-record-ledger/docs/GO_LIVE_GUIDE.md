# GO LIVE GUIDE: National Health Record Ledger

This guide explains how to transition from **Simulation Mode** to **Live Blockchain Mode**.

## Prerequisites
1.  **Docker Desktop** installed and running.
2.  **Node.js** (v18+) installed.
3.  **Remix IDE** (for compiling Solidity) or Hardhat.

---

## Step 1: Start Infrastructure
Navigate to the Docker directory and start the services. This brings up the Hyperledger Fabric peers and the Ethereum Ganache node.

```bash
cd national-health-record-ledger/docker
docker-compose up -d
```

---

## Step 2: Deploy Ethereum Smart Contract
Since `ethers.js` cannot compile Solidity directly in the browser/runtime easily without huge dependencies, use Remix.

1.  Open [Remix IDE](https://remix.ethereum.org).
2.  Create a new file `MedicalAnchor.sol`.
3.  Copy content from `national-health-record-ledger/on-chain/ethereum/contracts/MedicalAnchor.sol`.
4.  Compile the contract (Ctrl+S).
5.  Go to "Deploy & Run Transactions".
    *   Environment: **External Http Provider** (http://localhost:8545).
    *   (This connects to your Docker Ganache node).
6.  Click **Deploy**.
7.  Copy the **Deployed Contract Address**.

---

## Step 3: Deploy Hyperledger Fabric Chaincode
You need to install the Go chaincode onto the peers.

1.  Enter the CLI container (if using standard fabric-samples) OR run the provided script if you have local binaries:
    ```bash
    cd national-health-record-ledger/scripts
    ./deploy_fabric.sh
    ```
    *(Note: This script assumes you have `peer` binaries in your PATH and standard Fabric environment variables set. If not, follow the official Hyperledger Fabric "Test Network" tutorial to install the chaincode found in `on-chain/hyperledger/chaincode`)*.

---

## Step 4: Configure API Gateway
Navigate to the API Gateway folder.

```bash
cd national-health-record-ledger/off-chain/api-gateway
```

Create a `.env` file with your configuration:

```env
# Toggle Mode
BLOCKCHAIN_MODE=REAL

# Ethereum Config
ETH_RPC_URL=http://localhost:8545
ETH_PRIVATE_KEY=0x... (Copy private key from Ganache logs or Docker logs)
ETH_CONTRACT_ADDRESS=0x... (Paste address from Step 2)

# Fabric Config
# (Connection profile is loaded from connection-profile.json)
```

---

## Step 5: Run the API
Start the backend server.

```bash
npm install
node index.js
```

**Verification:**
When you send a request to `POST /api/records/create`, watch the console.
*   It should say `!!! RUNNING IN REAL BLOCKCHAIN MODE !!!`.
*   It should log actual Ethereum transaction hashes.
*   It should log Fabric transaction IDs.
