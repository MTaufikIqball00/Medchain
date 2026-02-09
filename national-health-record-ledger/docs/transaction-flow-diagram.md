# Transaction Flow Diagram

## Cross-Hospital Data Request Workflow

```mermaid
sequenceDiagram
    participant DrA as Dr. Budi (RS-A)
    participant SysA as RS-A System
    participant API as API Gateway
    participant ETH as Ethereum (Ganache)
    participant FAB as Hyperledger Fabric
    participant SysB as RS-B System
    participant AdminB as Admin RS-B

    Note over DrA,AdminB: Phase 1: Request Initiation

    DrA->>SysA: Login & Click "Request External Data"
    DrA->>SysA: Input PatientUID + Purpose
    SysA->>API: POST /api/data-request/create
    API->>API: Validate & Generate RequestID
    API->>ETH: requestPatientData(requestId, targetHospital, patientUID, purpose)
    ETH-->>API: Transaction Hash
    API->>FAB: CreateDataRequest (Audit Trail)
    FAB-->>API: Fabric TX ID
    API-->>SysA: 201 Created {request_id, eth_tx_hash}
    SysA-->>DrA: "Request Submitted"

    Note over DrA,AdminB: Phase 2: Notification & Review

    API->>SysB: Notify: New pending request
    SysB->>AdminB: Display pending request
    AdminB->>SysB: Review request details
    AdminB->>SysB: Click "Approve" or "Reject"

    Note over DrA,AdminB: Phase 3a: Approval Flow

    SysB->>API: POST /api/data-request/approve/:requestId
    API->>ETH: approveRequest(requestId)
    ETH-->>API: Transaction Hash + Expiry (24h)
    API->>FAB: ApproveDataRequest (Audit Trail)
    API->>SysB: 200 OK {expires_at}

    Note over DrA,AdminB: Phase 4: Data Access

    SysB->>API: POST /api/data-request/anchor-hash/:requestId
    Note right of SysB: Anchor SHA-256 hash of shared data
    API->>ETH: anchorDataHash(requestId, dataHash)
    ETH-->>API: Transaction Hash
    
    SysA->>API: GET /api/data-request/status/:requestId
    API-->>SysA: {status: APPROVED, expires_at: ...}
    SysA->>API: GET /api/fabric/records/:recordId
    API-->>SysA: Decrypted medical data
    SysA-->>DrA: Display patient data

    Note over DrA,AdminB: Phase 5: Auto-Expiration (After 24h)

    ETH->>ETH: Check: block.timestamp > expiresAt
    Note right of ETH: Status becomes EXPIRED
    SysA->>API: GET /api/data-request/status/:requestId
    API-->>SysA: {status: EXPIRED, is_access_active: false}
```

---

## Alternative Flow: Request Rejection

```mermaid
sequenceDiagram
    participant SysA as RS-A System
    participant API as API Gateway
    participant ETH as Ethereum (Ganache)
    participant SysB as RS-B System
    participant AdminB as Admin RS-B

    Note over SysA,AdminB: Rejection Flow

    AdminB->>SysB: Review request → Click "Reject"
    SysB->>API: POST /api/data-request/reject/:requestId
    API->>ETH: rejectRequest(requestId)
    ETH-->>API: Transaction Hash
    API-->>SysB: 200 OK {status: REJECTED}
    
    SysA->>API: GET /api/data-request/status/:requestId
    API-->>SysA: {status: REJECTED}
    SysA-->>SysA: Display: "Request Denied"
```

---

## Data Flow Architecture

```mermaid
flowchart TB
    subgraph "Layer 1: Off-Chain (PostgreSQL)"
        PII[("PII Data<br/>Patient Names, NIK")]
        EMR[("Encrypted Medical Records")]
    end

    subgraph "Layer 2: Private Chain (Hyperledger Fabric)"
        META[/"Metadata & Access Logs"/]
        AUDIT[/"Complete Audit Trail"/]
    end

    subgraph "Layer 3: Public Chain (Ethereum/Ganache)"
        ANCHOR[/"Trust Anchor<br/>Data Hashes Only"/]
        ACCESS[/"Access Requests<br/>Pseudonymized IDs"/]
    end

    subgraph "API Gateway"
        API[Node.js Express]
    end

    API --> PII
    API --> EMR
    API --> META
    API --> AUDIT
    API --> ANCHOR
    API --> ACCESS

    style PII fill:#ff6b6b,color:#fff
    style EMR fill:#ff6b6b,color:#fff
    style META fill:#4ecdc4,color:#fff
    style AUDIT fill:#4ecdc4,color:#fff
    style ANCHOR fill:#45b7d1,color:#fff
    style ACCESS fill:#45b7d1,color:#fff
```

---

## State Machine: Request Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: requestPatientData()
    PENDING --> APPROVED: approveRequest()
    PENDING --> REJECTED: rejectRequest()
    APPROVED --> EXPIRED: 24 hours elapsed
    REJECTED --> [*]
    EXPIRED --> [*]
    
    note right of PENDING: Waiting for target hospital
    note right of APPROVED: Access active for 24h
    note right of EXPIRED: Automatic after timeout
```

---

## What Goes On-Chain vs Off-Chain

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Patient Name | ❌ Off-chain (PostgreSQL) | PII - GDPR |
| NIK / ID Asli | ❌ Off-chain (PostgreSQL) | PII - GDPR |
| Medical Records | ❌ Off-chain (PostgreSQL) | Sensitive health data |
| PatientUID (hashed) | ✅ On-chain (Ethereum) | Pseudonymized |
| Hospital IDs | ✅ On-chain (Ethereum) | Non-sensitive |
| Request Status | ✅ On-chain (Ethereum) | Immutable audit |
| Data Hash (SHA-256) | ✅ On-chain (Ethereum) | Integrity verification |
| Timestamps | ✅ On-chain (Ethereum) | Tamper-proof logging |
| Full Audit Trail | ✅ On-chain (Fabric) | Detailed consortium logs |
