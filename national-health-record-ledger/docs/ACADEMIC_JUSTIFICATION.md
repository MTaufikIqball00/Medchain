# Academic Justification: Hybrid Blockchain Architecture for National Health Records

**Author:** Senior Blockchain Architect
**Date:** 2024

## 1. The Problem with Pure Blockchain for Medical Data
Storing raw medical records (JSON, PDF, Lab Results) directly on a public or even permissioned blockchain violates several key principles and regulations:

*   **GDPR / UU PDP (Indonesia) Violation:** Blockchains are immutable. If a patient requests the "Right to Erasure" (Right to be Forgotten), data on a blockchain cannot be deleted.
*   **Scalability:** Medical data is large (megabytes to gigabytes). Blockchains are designed for small transaction data (kilobytes). Storing files on-chain is prohibitively expensive and slow.
*   **Privacy:** Even with encryption, putting encrypted PII (Personally Identifiable Information) on a public ledger is considered a risk (future decryption attacks).

## 2. The Hybrid Solution (Off-Chain + On-Chain)

This project implements a **Hybrid Architecture** that balances Privacy, Integrity, and Availability.

### A. Off-Chain Storage (Hospital Nodes)
*   **Role:** Stores the actual medical data (encrypted).
*   **Technology:** Local Databases (SQL/NoSQL) or Distributed File Systems (IPFS Private).
*   **Justification:** Allows for high-volume storage. Supports **CRUD** operations, enabling doctors to correct errors (Right to Rectification) and delete data (Right to Erasure) by simply removing the encryption key or the file itself.

### B. Hyperledger Fabric (Private Consortium)
*   **Role:** Acts as the "Index" and "Access Control" layer.
*   **Data Stored:** Metadata only (RecordID, HospitalID, Hash). **NO PII**.
*   **Justification:**
    *   **Permissioned:** Only authorized hospitals can join the network.
    *   **Privacy:** Using Channels and Private Data Collections (PDC) ensures transaction privacy between specific hospitals.
    *   **Soft Delete:** Chaincode implements a logical delete flag (`isDeleted`), maintaining an immutable audit trail that a record *existed* and was *deleted*, without exposing the content.

### C. Ethereum (Public Anchor)
*   **Role:** The "Trust Anchor" or "Proof of Existence".
*   **Data Stored:** SHA-256 Hash and Timestamp only.
*   **Justification:**
    *   **Immutability:** Public blockchains are practically impossible to rewrite.
    *   **Public Verification:** Any patient or auditor can verify the integrity of their record without needing access to the private hospital network. They simply hash their off-chain file and compare it to the value on Ethereum.

## 3. Data Lifecycle & Compliance

1.  **Creation:** Data created off-chain -> Encrypted (AES-256) -> Hash (SHA-256) -> Hash sent to Ethereum -> Metadata sent to Fabric.
2.  **Access:** Request -> Check Fabric ACL -> Retrieve Encrypted Blob Off-chain -> Decrypt locally.
3.  **Rectification (Correction):** Create new version Off-chain -> New Hash -> Update Fabric Pointer (Version 2) -> Anchor new hash to Eth.
4.  **Erasure (Deletion):** Delete Off-chain Blob -> Call `SoftDelete` on Fabric. The metadata remains as a "tombstone" (audit log), but the actual data is gone forever.

## 4. Pseudonymization
We utilize a `PatientUID` derived from a salted hash of the National ID (NIK). The mapping table (`NIK <-> UID`) exists ONLY in the Off-Chain database of the registering hospital. The blockchain only ever sees the `UID`. This ensures that even if the blockchain is compromised, no real identities are revealed.
