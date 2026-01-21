# Laporan Evaluasi Teknis: National Health Record Ledger

## Ringkasan Eksekutif
Proyek ini mengimplementasikan arsitektur **Hybrid Blockchain** yang menggabungkan Hyperledger Fabric (Permissioned) dan Ethereum (Public) dengan penyimpanan data off-chain. Berdasarkan audit kode, sistem telah memenuhi sebagian besar prinsip keamanan, privasi, dan integritas data yang dipersyaratkan.

Berikut adalah evaluasi mendalam berdasarkan 7 poin pemeriksaan:

---

## 1. Penyimpanan Data Sensitif (Off-Chain)
**Status: ✅ Sesuai**

*   **Analisis:** Kode pada `recordController.js` menunjukkan bahwa `clinicalData` (data medis riil) tidak pernah dikirim langsung ke blockchain.
*   **Implementasi:** Data disimpan secara lokal menggunakan `utils/db.js` (simulasi database JSON) setelah dienkripsi.
*   **Bukti:**
    *   `recordController.js`: `saveRecord` menyimpan data ke DB lokal.
    *   Chaincode (`main.go`): Hanya menerima `Metadata` (RecordID, Hash, Location), bukan data klinis.

## 2. Integritas Data (Hashing)
**Status: ✅ Sesuai**

*   **Analisis:** Sistem menggunakan algoritma SHA-256 untuk memastikan integritas data.
*   **Implementasi:** Sebelum data disimpan off-chain atau metadata dikirim ke Fabric, sistem menghitung hash.
*   **Bukti:**
    *   `utils/crypto.js`: Fungsi `hashData` menggunakan `crypto.createHash('sha256')`.
    *   `recordController.js`: Hash dihitung (`hashData(clinicalData)`) dan dikirim ke fungsi `CreateMetadata` (Fabric) dan `anchorHash` (Ethereum).

## 3. Peran Hyperledger Fabric (Permissioned)
**Status: ✅ Sesuai**

*   **Analisis:** Hyperledger Fabric digunakan sesuai peruntukannya sebagai lapisan permissioned untuk metadata dan kontrol akses.
*   **Implementasi:** Chaincode (`main.go`) mengelola struktur `MedicalMetadata` yang berisi Access List dan Pending Requests.
*   **Bukti:**
    *   Fungsi `ReadMetadata` memvalidasi `requesterId` terhadap `AccessList` sebelum mengembalikan metadata.
    *   Audit trail tercatat secara implisit melalui mekanisme ledger Fabric (history transaksi).

## 4. Peran Ethereum (Public)
**Status: ✅ Sesuai (dengan catatan minor)**

*   **Analisis:** Ethereum digunakan sebagai "Trust Anchor" publik.
*   **Implementasi:** Smart contract `MedicalAnchor.sol` menyimpan `RecordProof` yang berisi hash data. Ini memungkinkan verifikasi integritas tanpa perlu akses ke jaringan permissioned.
*   **Catatan:** Contract melakukan hashing ulang (`keccak256`) terhadap input string hash SHA-256. Ini valid secara teknis untuk anchoring, namun verifikator eksternal harus menyadari proses double-hashing ini.

## 5. Mekanisme Permintaan Akses
**Status: ✅ Sesuai**

*   **Analisis:** Terdapat alur kerja lengkap untuk Request dan Approve akses antar entitas (Rumah Sakit).
*   **Implementasi:**
    *   **Chaincode:** Fungsi `RequestAccess` dan `GrantAccess` mengelola state `PendingRequests` dan `AccessList`.
    *   **API:** `accessController.js` menyediakan endpoint `/request` dan `/approve` yang memanggil fungsi chaincode tersebut.

## 6. Verifikasi Data (Hash Comparison)
**Status: ✅ Sesuai**

*   **Analisis:** Sistem menyediakan endpoint untuk memverifikasi bahwa data off-chain belum dimanipulasi.
*   **Implementasi:** Endpoint `POST /verify` menerima data mentah, menghitung hash ulang, dan membandingkannya dengan hash yang tersimpan di Hyperledger Fabric (`metadata.dataHash`).
*   **Rekomendasi Peningkatan:** Saat ini verifikasi hanya membandingkan dengan Fabric. Untuk kepercayaan publik yang lebih tinggi, disarankan menambahkan opsi verifikasi silang (cross-verification) terhadap hash yang ada di Ethereum (`MedicalAnchor`).

## 7. Keamanan dan Privasi (Privacy & Trust)
**Status: ✅ Sesuai**

*   **Enkripsi:** Menggunakan AES-256-CBC (`utils/crypto.js`) dengan IV unik untuk setiap enkripsi. Kunci enkripsi diambil dari environment variable.
*   **Privasi Pasien:** Menggunakan `PatientUID` (pseudonym) hasil hash dari NIK + Salt, sehingga NIK asli tidak terekspos.
*   **Trust:** Model Hybrid memisahkan data sensitif (Off-chain/Private) dengan bukti integritas (On-chain/Public), memenuhi prinsip "Trust but Verify".
*   **Kekurangan Keamanan (Code Level):** Pada `MedicalAnchor.sol`, modifier `onlyAuthorizedHospital` masih kosong (placeholder). Dalam produksi, ini harus diimplementasikan untuk mencegah spamming ke public network oleh pihak tidak berwenang.

---

## Kesimpulan & Rekomendasi Teknis

Proyek ini **sudah benar secara konsep dan arsitektur**. Implementasi teknis telah mencakup seluruh persyaratan fungsional utama untuk rekam medis berbasis privasi.

### Rekomendasi Perbaikan:
1.  **Lengkapi Security Modifier di Ethereum:** Implementasikan logika whitelist address pada `MedicalAnchor.sol` (`onlyAuthorizedHospital`).
2.  **Verifikasi Ethereum di API:** Update endpoint `/verify` agar tidak hanya mengecek Fabric, tapi juga memvalidasi keberadaan anchor di Ethereum untuk jaminan immutability yang lebih kuat.
3.  **Key Management:** Pastikan `ENCRYPTION_KEY` dan `UID_SALT` dikelola menggunakan Key Management System (KMS) yang aman di lingkungan produksi, bukan sekadar environment variable biasa.
