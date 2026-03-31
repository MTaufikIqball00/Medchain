# Diagram Arsitektur dan Alur Sistem National Health Record Ledger

Dokumen ini berisi representasi visual dari arsitektur sistem, alur kerja, dan model data berdasarkan implementasi teknis saat ini.

---

## 1. Arsitektur Sistem (System Architecture)

Diagram ini menggambarkan interaksi antara komponen utama: Frontend (React), Backend API (Node.js), layanan eksternal (AI), dan jaringan Blockchain (Hyperledger Fabric).

```mermaid
graph TD
    User[Dokter / Admin RS] -->|HTTPS| Frontend[Frontend React (Vite)]

    subgraph "Off-Chain Layer (Private)"
        Frontend -->|REST API| APIGateway[API Gateway (Node.js)]
        APIGateway -->|Analisis Medis| AI[Google Gemini AI Service]
        APIGateway -->|Enkripsi AES-256| EncryptModule[Encryption Module]
        EncryptModule -->|Simpan Data Terenkripsi| DB[(Off-Chain Storage\nIn-Memory / PostgreSQL)]
    end

    subgraph "On-Chain Layer (Consortium)"
        APIGateway -->|Submit Hash & Metadata| FabricSDK[Fabric SDK]
        FabricSDK -->|Invoke Chaincode| Peer1[Peer Node (RS A)]
        FabricSDK -->|Invoke Chaincode| Peer2[Peer Node (RS B)]
        Peer1 <-->|Gossip| Peer2
        Peer1 -->|Order Transaction| Orderer[Orderer Node]
        Peer2 -->|Order Transaction| Orderer
    end

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef blockchain fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef storage fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    class Peer1,Peer2,Orderer blockchain;
    class DB storage;
```

---

## 2. Workflow Sistem (System Workflow)

Alur kerja utama: **Pembuatan Rekam Medis Baru dengan Bantuan AI**.

```mermaid
sequenceDiagram
    participant Dokter
    participant Frontend
    participant API as API Gateway
    participant AI as Google Gemini
    participant DB as Off-Chain DB
    participant Fabric as Hyperledger Fabric

    Dokter->>Frontend: Input Gejala & Catatan Kasar
    Frontend->>API: Request Analisis AI (symptoms, notes)
    API->>AI: Prompt Engineering + Data
    AI-->>API: Hasil Diagnosis & Rekomendasi (JSON)
    API-->>Frontend: Tampilkan Hasil Analisis

    Dokter->>Frontend: Validasi & Konfirmasi Simpan
    Frontend->>API: POST /records/create (Data Medis)

    rect rgb(240, 248, 255)
        Note over API: Proses Keamanan Data
        API->>API: Enkripsi Data (AES-256)
        API->>API: Hashing Data (SHA-256)
    end

    API->>DB: Simpan Ciphertext + ID

    rect rgb(255, 240, 245)
        Note over API, Fabric: Konsensus Blockchain
        API->>Fabric: Submit Transaction (Metadata, Hash, AccessList)
        Fabric-->>API: TxID & Block Number
    end

    API-->>Frontend: Sukses (Record ID)
    Frontend-->>Dokter: Notifikasi Berhasil
```

---

## 3. Data Flow Diagram (DFD)

### Level 0 (Context Diagram)

Diagram konteks yang menunjukkan batasan sistem dan entitas eksternal.

```mermaid
graph LR
    Dokter[Dokter / Tenaga Medis]
    Pasien[Pasien]
    Admin[Admin RS]
    System((Sistem Rekam Medis\nBlockchain Hybrid))
    AI_Ext[Layanan AI Google]

    Dokter -->|Input Data Medis| System
    Dokter -->|Request Akses Data| System
    System -->|Hasil Analisis AI| Dokter
    System -->|Data Rekam Medis| Dokter

    Pasien -->|Memberikan Izin| System
    System -->|Riwayat Akses| Pasien

    Admin -->|Manajemen User| System

    System <-->|Proses Analisis| AI_Ext
```

### Level 1 (Sistem Utama)

Pecahan proses utama dalam sistem.

```mermaid
graph TD
    User[User]

    Process1((1.0\nManajemen Autentikasi))
    Process2((2.0\nAnalisis AI))
    Process3((3.0\nManajemen Rekam Medis))
    Process4((4.0\nKontrol Akses))

    DS1[(Data User)]
    DS2[(Off-Chain DB)]
    DS3[(Blockchain Ledger)]

    User -->|Login| Process1
    Process1 -->|Token Valid| User
    Process1 <--> DS1

    User -->|Input Gejala| Process2
    Process2 -->|Hasil Diagnosis| User

    User -->|Simpan Data| Process3
    Process3 -->|Enkripsi| Process3
    Process3 -->|Simpan Data| DS2
    Process3 -->|Catat Hash| DS3

    User -->|Request Data| Process4
    Process4 -->|Cek Izin| DS3
    Process4 -->|Ambil Data| DS2
    DS2 -->|Data Terenkripsi| Process4
    Process4 -->|Dekripsi| User
```

### Level 2 (Detail Proses 3.0 - Manajemen Rekam Medis)

Detail langkah teknis dalam penyimpanan rekam medis.

```mermaid
graph TD
    Input[Data Medis Valid] --> P3_1((3.1\nGenerate ID))
    P3_1 --> P3_2((3.2\nEnkripsi Data))
    P3_2 -->|Ciphertext| P3_3((3.3\nSimpan Off-Chain))
    P3_2 -->|Original Data| P3_4((3.4\nHashing SHA-256))
    P3_4 -->|Hash| P3_5((3.5\nSubmit ke Blockchain))

    P3_3 --> DB[(Database)]
    P3_5 --> Ledger[(Hyperledger Fabric)]
```

---

## 4. Entity Relationship Diagram (ERD)

Diagram ini menggambarkan struktur data logis, memisahkan data off-chain (lengkap) dan on-chain (metadata).

```mermaid
erDiagram
    PATIENT ||--o{ MEDICAL_RECORD : has
    HOSPITAL ||--o{ MEDICAL_RECORD : creates
    MEDICAL_RECORD ||--o{ ACCESS_LOG : generates

    PATIENT {
        string patient_uid PK "Nomor RM / NIK"
        string name
        date dob
        string gender
    }

    MEDICAL_RECORD {
        uuid record_id PK "UUID (Off-Chain & On-Chain Link)"
        string hospital_id FK
        string patient_uid FK
        text encrypted_data "AES-256 Ciphertext (Off-Chain Only)"
        string data_hash "SHA-256 (On-Chain)"
        timestamp created_at
        boolean is_deleted
        int version
    }

    ACCESS_LOG {
        uuid log_id PK
        uuid record_id FK
        string requester_id
        timestamp access_time
        string action "READ/WRITE/DELETE"
    }

    HOSPITAL {
        string hospital_id PK
        string name
        string public_key
        string address
    }
```

---

## 5. Use Case Diagram

Interaksi aktor dengan fitur-fitur sistem.

```mermaid
usecaseDiagram
    actor "Dokter" as Doc
    actor "Admin RS" as Admin
    actor "Sistem AI" as AI

    package "Sistem Rekam Medis Blockchain" {
        usecase "Login / Autentikasi" as UC1
        usecase "Input Data Pasien" as UC2
        usecase "Minta Analisis AI" as UC3
        usecase "Simpan Rekam Medis (Create)" as UC4
        usecase "Lihat Rekam Medis (Read)" as UC5
        usecase "Update Rekam Medis" as UC6
        usecase "Hapus Rekam Medis (Soft Delete)" as UC7
        usecase "Kelola Hak Akses" as UC8
    }

    Doc --> UC1
    Doc --> UC2
    Doc --> UC3
    Doc --> UC4
    Doc --> UC5
    Doc --> UC6
    Doc --> UC7

    Admin --> UC1
    Admin --> UC8

    UC3 <.. AI : "Generate Diagnosis"
    UC4 ..> UC3 : "<<include>>"
    UC4 --> UC8 : "<<update>> Access List"
```
