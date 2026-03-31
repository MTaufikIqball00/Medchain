# Revisi dan Pelengkap Laporan Blockchain (As-Built Documentation)

Dokumen ini berisi revisi teks untuk bagian-bagian dalam `Laporan Blockchain.docx` yang tidak sesuai dengan implementasi teknis saat ini, serta penambahan materi mengenai fitur baru (Integrasi AI) yang belum tercakup dalam laporan awal.

---

## 1. Revisi: Alur Data Transaksi & Enkripsi (Bab Implementasi)

**Masalah pada Laporan Awal:** Menyatakan enkripsi dilakukan di sisi Client (Frontend).
**Fakta Implementasi:** Enkripsi dilakukan di sisi Server (API Gateway) sebelum penyimpanan off-chain.

**Teks Revisi (Usulan):**

> **Alur Keamanan dan Privasi Data Medis**
>
> Dalam implementasi saat ini, keamanan data medis pasien dijamin melalui mekanisme enkripsi bertingkat yang dijalankan pada sisi server (Server-Side Encryption). Alur data dapat dijelaskan sebagai berikut:
>
> 1.  **Input Data:** Dokter memasukkan data diagnosis dan catatan medis melalui antarmuka frontend yang aman (HTTPS). Data dikirimkan ke API Gateway dalam bentuk payload JSON standar.
> 2.  **Enkripsi Server:** Saat API Gateway menerima data, modul kontroler (`recordController.js`) secara otomatis melakukan enkripsi terhadap seluruh objek data klinis menggunakan algoritma **AES-256** sebelum data tersebut diproses lebih lanjut.
> 3.  **Penyimpanan Off-Chain:** Data yang telah terenkripsi (Ciphertext) kemudian disimpan ke dalam basis data off-chain. Pada tahap prototipe ini, sistem menggunakan penyimpanan sementara (*In-Memory Store*) yang dirancang untuk dapat dimigrasikan ke **PostgreSQL** pada tahap produksi. Hal ini memastikan bahwa meskipun basis data diakses secara langsung, data medis pasien tetap tidak dapat dibaca tanpa kunci dekripsi yang dikelola oleh `KeyManager`.
> 4.  **Hashing dan Blockchain:** Bersamaan dengan proses penyimpanan, sistem menghasilkan nilai hash **SHA-256** dari data asli. Nilai hash inilah yang dikirimkan ke jaringan Blockchain **Hyperledger Fabric** sebagai bukti integritas (Proof of Integrity), memastikan bahwa data tidak dimanipulasi tanpa terdeteksi.

---

## 2. Revisi: Infrastruktur Jaringan Blockchain (Bab Pengujian/Analisis)

**Masalah pada Laporan Awal:** Menyatakan jaringan terdiri dari 5 Node (3 RS, 1 Kemenkes, 1 Auditor).
**Fakta Implementasi:** Konfigurasi Docker saat ini menjalankan 2 Peer Node (Hospital A & Hospital B) dan 1 Orderer.

**Teks Revisi (Usulan):**

> **Konfigurasi Node Jaringan (Prototipe)**
>
> Untuk keperluan validasi konsep (Proof of Concept) dan pengujian performa awal, lingkungan pengembangan dikonfigurasi menggunakan topologi jaringan minimal yang merepresentasikan interaksi antar-rumah sakit. Konfigurasi saat ini meliputi:
>
> *   **Orderer Node:** 1 node layanan pemesanan (Ordering Service) berbasis Raft yang bertugas mengurutkan transaksi dan membuat blok.
> *   **Peer Nodes:** 2 node peer yang mewakili dua organisasi rumah sakit berbeda (Hospital A dan Hospital B). Setiap peer menjalankan *smart contract* (Chaincode) untuk validasi transaksi dan penyimpanan metadata.
> *   **Certificate Authority (CA):** 2 layanan CA untuk manajemen identitas masing-masing organisasi.
>
> Meskipun skala pengujian saat ini menggunakan 2 node peer, arsitektur sistem telah dirancang secara modular untuk dapat diskalakan hingga 5 node atau lebih (termasuk node regulator/Kemenkes) sesuai dengan desain arsitektur target pada tahap produksi.

---

## 3. Penambahan: Integrasi Kecerdasan Buatan (Fitur Baru)

**Status:** Bagian ini belum ada dalam laporan awal.
**Fakta Implementasi:** Sistem telah mengintegrasikan Google Gemini AI untuk analisis medis otomatis.

**Teks Tambahan (Usulan Bab Baru atau Sub-Bab):**

> **Implementasi Kecerdasan Buatan (AI) untuk Analisis Medis**
>
> Sebagai upaya meningkatkan efisiensi diagnosis dan layanan kesehatan, sistem National Health Record Ledger telah diintegrasikan dengan layanan **Google Gemini AI** (Model: `gemini-2.5-flash`). Fitur ini berfungsi sebagai asisten cerdas bagi tenaga medis dalam menganalisis gejala dan catatan awal pasien.
>
> **Mekanisme Kerja:**
> 1.  **Input:** Sistem menerima input berupa daftar gejala pasien (`symptoms`) dan catatan kasar dokter (`rawNotes`).
> 2.  **Pemrosesan AI:** Data tersebut dikirim ke API Google Gemini dengan *prompt* khusus yang memposisikan AI sebagai ahli medis.
> 3.  **Output Terstruktur:** Model AI mengembalikan hasil analisis dalam format JSON terstruktur yang mencakup:
>     *   **Suggested Diagnosis:** Diagnosis awal yang disarankan berdasarkan gejala.
>     *   **Summary:** Ringkasan profesional mengenai kondisi pasien.
>     *   **Severity Level:** Penilaian tingkat keparahan kondisi (Low, Moderate, High, Critical).
>     *   **Recommended Actions:** Daftar langkah penanganan atau pemeriksaan lanjutan yang direkomendasikan.
>
> **Manfaat:**
> Integrasi ini memungkinkan standardisasi catatan medis dan memberikan opini kedua (second opinion) secara instan kepada dokter, yang pada akhirnya dapat mengurangi risiko kesalahan diagnosis (human error) dan mempercepat proses penanganan pasien. Hasil analisis AI ini dapat divalidasi oleh dokter sebelum disimpan secara permanen ke dalam rekam medis elektronik berbasis blockchain.

---

## 4. Revisi: Integrasi Ethereum (Bab Arsitektur)

**Masalah pada Laporan Awal:** Menyatakan integrasi Ethereum aktif untuk *public verification*.
**Fakta Implementasi:** Kode integrasi Ethereum ada namun dinonaktifkan (Commented Out) pada controller utama.

**Teks Revisi (Usulan):**

> **Arsitektur Dual-Mode (Hybrid Blockchain Capability)**
>
> Sistem dirancang dengan kemampuan **Hybrid Blockchain** yang unik, menggabungkan Hyperledger Fabric (Private/Permissioned) untuk privasi data dan Ethereum (Public) untuk transparansi publik.
>
> Pada versi implementasi saat ini, sistem beroperasi dalam mode **Private-Primary**, di mana pencatatan metadata dan hash integritas difokuskan pada jaringan Hyperledger Fabric. Komponen penghubung ke jaringan Ethereum (Smart Contract `MedicalAnchor`) telah tersedia sebagai modul opsional yang dapat diaktifkan melalui konfigurasi (`BLOCKCHAIN_MODE`). Hal ini memberikan fleksibilitas bagi konsorsium rumah sakit untuk memilih tingkat transparansi publik yang diinginkan tanpa mengubah arsitektur inti sistem.
