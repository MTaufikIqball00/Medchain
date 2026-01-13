const express = require('express');
const router = express.Router();
const { encrypt, hashData } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');

// Mock Blockchain Service Calls (Since we can't run real Fabric/Eth nodes here)
const mockFabric = require('../services/mockFabric');
const mockEthereum = require('../services/mockEthereum');

// Mock Off-Chain Storage
const recordsDB = {};

router.post('/create', async (req, res) => {
    try {
        const { patientUid, hospitalId, clinicalData, description } = req.body;

        // 1. Generate Record ID
        const recordId = uuidv4();

        // 2. Encrypt Clinical Data (AES-256)
        // This ensures "Right to Rectification" (we can update this off-chain blob)
        // and "Right to Erasure" (we can delete the key or the blob)
        const encryptedData = encrypt(JSON.stringify(clinicalData));

        // 3. Save Off-Chain
        recordsDB[recordId] = {
            patientUid,
            encryptedData, // Only encrypted data stored
            hospitalId
        };
        const offChainLoc = `https://api.hospital-node.com/records/${recordId}`;

        // 4. Create Integrity Hash (SHA-256)
        const dataHash = hashData(clinicalData); // Hash the original data for integrity proof

        // 5. Submit Metadata to Hyperledger Fabric
        // Contains: Access Control, Soft Delete Status, Pointer to Off-Chain
        await mockFabric.submitTransaction('CreateMetadata', recordId, patientUid, hospitalId, offChainLoc, dataHash, description);

        // 6. Anchor Hash to Ethereum
        // Contains: Immutable Timestamp & Hash
        const txHash = await mockEthereum.anchorHash(recordId, dataHash, hospitalId);

        res.json({
            success: true,
            recordId,
            ethereumTx: txHash,
            message: "Record secured on Hybrid Ledger"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:recordId', async (req, res) => {
    // 1. Check Access via Fabric (Consent)
    // 2. Retrieve Off-Chain Data
    // 3. Decrypt and Return
    res.json({ message: "Not implemented in simulation" });
});

module.exports = router;
