# EXTERNAL INFRASTRUCTURE INTEGRATION GUIDE

This guide explains how to connect the **MedChain API Gateway** to your existing external blockchain networks (located in `../ethereum` and `../fabric`).

## Prerequisites

*   You have an **Ethereum Network** running (e.g., Geth, Hardhat, or Ganache) in your `ethereum` folder.
*   You have a **Hyperledger Fabric Network** running (e.g., Test Network) in your `fabric` folder.
*   You have access to the terminal to run commands in these folders.

---

## Part 1: Ethereum Deployment

1.  **Locate the Smart Contract**:
    The source code is at: `Medchain/national-health-record-ledger/on-chain/ethereum/contracts/MedicalAnchor.sol`

2.  **Deploy to Your Network**:
    *   Navigate to your `ethereum` folder.
    *   Use your preferred tool (Hardhat/Truffle/Remix) to compile and deploy `MedicalAnchor.sol`.
    *   *Note:* Ensure the contract is compiled with Solidity ^0.8.0.

3.  **Capture Configuration**:
    After deployment, note down:
    *   **Contract Address**: (e.g., `0x123...`)
    *   **RPC URL**: (e.g., `http://127.0.0.1:8545`)
    *   **Private Key**: The key of the account that will submit transactions (e.g., from your local node).

---

## Part 2: Hyperledger Fabric Deployment

1.  **Locate the Chaincode**:
    The source code is at: `Medchain/national-health-record-ledger/on-chain/hyperledger/chaincode`

2.  **Package & Install**:
    *   Navigate to your `fabric` folder (where your `peer` binaries or test-network scripts are).
    *   Package the chaincode from the `Medchain` path:
        ```bash
        peer lifecycle chaincode package medchain.tar.gz --path ../Medchain/national-health-record-ledger/on-chain/hyperledger/chaincode --lang go --label medchain_1.0
        ```
    *   Install the package on your peers:
        ```bash
        peer lifecycle chaincode install medchain.tar.gz
        ```

3.  **Approve & Commit**:
    *   Approve and commit the chaincode definition to your channel (e.g., `mychannel`).
    *   *Tip:* If using the standard test-network script:
        ```bash
        ./network.sh deployCC -ccn medchain -ccp ../Medchain/national-health-record-ledger/on-chain/hyperledger/chaincode -ccl go
        ```

4.  **Capture Configuration**:
    *   **Connection Profile**: Locate the `connection-org1.json` (or similar) in your fabric network folder. Get the **Absolute Path** to this file.
    *   **Wallet**: You need a filesystem wallet containing an identity (e.g., `appUser`).
        *   If you don't have one, export the identity from your Fabric CA and save it to a folder (e.g., `fabric/wallet`).

---

## Part 3: Connect API Gateway

1.  **Navigate to the API Gateway**:
    ```bash
    cd Medchain/national-health-record-ledger/off-chain/api-gateway
    ```

2.  **Create/Edit `.env` File**:
    Create a `.env` file with the absolute paths and keys from the previous steps.

    ```env
    # Enable Real Mode
    BLOCKCHAIN_MODE=REAL

    # --- ETHEREUM CONFIG ---
    ETH_RPC_URL=http://localhost:8545
    ETH_CONTRACT_ADDRESS=0xYourDeployedContractAddress
    ETH_PRIVATE_KEY=0xYourPrivateKey

    # --- FABRIC CONFIG ---
    # Use ABSOLUTE PATHS to point to your external folders
    FABRIC_CONNECTION_PROFILE_PATH=/absolute/path/to/your/fabric/organizations/peerOrganizations/org1.example.com/connection-org1.json
    FABRIC_WALLET_PATH=/absolute/path/to/your/fabric/wallet
    FABRIC_USER_ID=appUser
    FABRIC_CHANNEL_NAME=mychannel
    FABRIC_CHAINCODE_NAME=medchain
    ```

3.  **Start the Server**:
    ```bash
    npm install
    node index.js
    ```

4.  **Verification**:
    Send a `POST /api/records/create` request. The logs should show successful transactions to your external Ethereum and Fabric nodes.
