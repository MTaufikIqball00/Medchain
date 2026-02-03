# National Health Record Ledger

A Hybrid Blockchain System for Secure, Compliant Medical Record Sharing.

## Architecture

*   **Off-Chain:** Node.js API Gateway + Encrypted Storage
*   **Private Chain:** Hyperledger Fabric (Metadata & Consent)
*   **Public Chain:** Ethereum (Integrity Anchor)

## Directory Structure

*   `off-chain/`: Backend services and simulation of hospital databases.
*   `on-chain/hyperledger/`: Chaincode (Smart Contracts) for the private consortium.
*   `on-chain/ethereum/`: Solidity contracts for public proofs.
*   `docker/`: Infrastructure configuration.

## Setup

1.  **Install Dependencies:**
    ```bash
    cd off-chain/api-gateway
    npm install
    ```

2.  **Run Simulation (Backend Only):**
    ```bash
    node index.js
    ```
    *Note: Blockchain services are mocked in this mode.*

3.  **Run Full Infrastructure (Requires Docker):**
    ```bash
    cd docker
    docker-compose up
    ```

## Key Features

*   **GDPR Compliance:** Right to Erasure implemented via Off-chain deletion and On-chain tombstoning.
*   **Pseudonymization:** Patient identities are hashed before reaching the network.
*   **Integrity:** Data hashing ensures records cannot be tampered with without detection.
