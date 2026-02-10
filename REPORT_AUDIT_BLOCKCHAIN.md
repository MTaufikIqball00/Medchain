# Laporan Audit: Perbandingan Implementasi Codebase vs Laporan Blockchain.docx

Berdasarkan analisis mendalam terhadap source code dan dokumen `Laporan Blockchain.docx`, ditemukan beberapa ketidaksesuaian (discrepancies) yang signifikan antara klaim di dalam laporan dengan implementasi teknis yang ada saat ini.

Berikut adalah rincian temuan tersebut:

## 1. Mekanisme Enkripsi (Encryption Mechanism)
*   **Klaim Laporan:** Enkripsi dilakukan di sisi **Client** (Frontend) sebelum data dikirim ke server ("data terlebih dahulu dienkripsi pada sisi client").
*   **Fakta di Codebase:** Enkripsi dilakukan di sisi **Server** (Backend API Gateway).
    *   File: `national-health-record-ledger/off-chain/api-gateway/src/controllers/recordController.js`
    *   Code: `const encryptedData = encrypt(JSON.stringify(clinicalData));`
    *   Frontend mengirimkan data klinis dalam bentuk *cleartext* (JSON biasa) ke API, yang kemudian mengenkripsinya.
*   **Status:** **TIDAK SESUAI / SALAH**

## 2. Integrasi Ethereum (Ethereum Integration)
*   **Klaim Laporan:** API Gateway mengirimkan hash data ke jaringan Ethereum sebagai bukti integritas publik.
*   **Fakta di Codebase:** Integrasi Ethereum **dinonaktifkan** secara eksplisit dalam kode.
    *   File: `national-health-record-ledger/off-chain/api-gateway/src/controllers/recordController.js`
    *   Comment: `// Only using Hyperledger Fabric (removed Ethereum dependency)`
    *   Logika untuk mengirim transaksi ke Ethereum tidak dipanggil dalam fungsi `create` atau `update`.
*   **Status:** **TIDAK SESUAI / FITUR HILANG**

## 3. Penyimpanan Data Off-Chain (Database Storage)
*   **Klaim Laporan:** Data terenkripsi disimpan dalam basis data **PostgreSQL**.
*   **Fakta di Codebase:** Backend saat ini menggunakan penyimpanan **In-Memory** (variabel JavaScript sementara).
    *   File: `national-health-record-ledger/off-chain/api-gateway/src/controllers/recordController.js`
    *   Code: `const recordsDB = {}; // Mock Off-Chain Storage`
    *   Meskipun konfigurasi PostgreSQL ada di `database.js`, controller utama tidak menggunakannya, sehingga data akan hilang jika server di-restart.
*   **Status:** **TIDAK SESUAI (Menggunakan Mock)**

## 4. Topologi Jaringan (Network Topology)
*   **Klaim Laporan:** Jaringan Hyperledger Fabric terdiri dari **5 Node** (3 RS, 1 Kemenkes, 1 Auditor).
*   **Fakta di Codebase:** Konfigurasi Docker Compose hanya menjalankan **2 Peer Node** (Hospital A & Hospital B).
    *   File: `national-health-record-ledger/docker/docker-compose.yml`
*   **Status:** **TIDAK SESUAI (Skala Lebih Kecil)**

## 5. Fitur AI (Gemini Integration)
*   **Klaim Laporan:** Tidak disebutkan (berdasarkan ekstraksi teks laporan).
*   **Fakta di Codebase:** Terdapat fitur analisis medis menggunakan **Google Gemini AI** yang sudah diimplementasikan di frontend.
    *   File: `legacy_prototype/services/geminiService.ts`
*   **Status:** **KURANG LENGKAP (Laporan tidak mencakup fitur ini)**

## Kesimpulan
Laporan `Laporan Blockchain.docx` tampaknya mendeskripsikan **Arsitektur Target (Ideal)** atau versi yang direncanakan untuk produksi, sedangkan codebase saat ini masih berupa **Prototipe / Proof of Concept (PoC)** dengan penyederhanaan signifikan (In-Memory DB, Mock Ethereum, Server-side Encryption).

**Rekomendasi:**
1.  Perbarui laporan agar sesuai dengan kondisi kode saat ini ("As-Built Documentation"), ATAU
2.  Tingkatkan kode agar sesuai dengan spesifikasi laporan (Aktifkan Ethereum, Pindahkan Enkripsi ke Client, Gunakan PostgreSQL, Tambah Node).
