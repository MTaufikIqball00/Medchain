const express = require('express');
const router = express.Router();
const { encrypt, decrypt, hashData } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

// Load Services based on Config
let fabricService, ethereumService;

if (config.BLOCKCHAIN_MODE === 'REAL') {
    console.log("!!! RUNNING IN REAL BLOCKCHAIN MODE !!!");
    fabricService = require('../services/realFabric');
    ethereumService = require('../services/realEthereum');
} else {
    console.log("--- RUNNING IN MOCK SIMULATION MODE ---");
    fabricService = require('../services/mockFabric');
    ethereumService = require('../services/mockEthereum');
}

// Mock Off-Chain Storage (In production, this would be a MongoDB/Postgres with Encrypted Columns)
const recordsDB = {};

/**
 * CREATE: Add new medical record
 */
router.post('/create', async (req, res) => {
    try {
        const { patientUid, hospitalId, clinicalData, description } = req.body;

        // 1. Generate Record ID
        const recordId = uuidv4();

        // 2. Encrypt Clinical Data (AES-256)
        const encryptedData = encrypt(JSON.stringify(clinicalData));

        // 3. Save Off-Chain
        recordsDB[recordId] = {
            patientUid,
            encryptedData,
            hospitalId,
            version: 1,
            isDeleted: false
        };
        const offChainLoc = `https://api.hospital-node.com/records/${recordId}`;

        // 4. Create Integrity Hash (SHA-256)
        const dataHash = hashData(clinicalData);

        // 5. Submit Metadata to Hyperledger Fabric
        const fabricTxId = await fabricService.submitTransaction('CreateMetadata', recordId, patientUid, hospitalId, offChainLoc, dataHash, description);

        // 6. Anchor Hash to Ethereum
        const txHash = await ethereumService.anchorHash(recordId, dataHash, hospitalId);

        res.json({
            success: true,
            recordId,
            fabricTxId,
            ethereumTx: txHash,
            message: "Record created and anchored"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ: Retrieve and decrypt medical record
 */
router.get('/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = recordsDB[recordId];

        if (!record) {
            return res.status(404).json({ error: "Record not found off-chain" });
        }

        if (record.isDeleted) {
            return res.status(410).json({ error: "Record has been deleted (Right to Erasure applied)" });
        }

        // In Real Fabric mode, we would verify Access Control here via Chaincode Query
        // await fabricService.evaluateTransaction('CheckAccess', recordId, requesterId);

        // Decrypt
        const decryptedData = JSON.parse(decrypt(record.encryptedData));

        res.json({
            success: true,
            recordId,
            patientUid: record.patientUid,
            version: record.version,
            data: decryptedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * UPDATE: Modify existing record (Right to Rectification)
 * - Updates off-chain data
 * - Anchors NEW hash to Ethereum
 * - Updates Fabric Metadata
 */
router.put('/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { clinicalData, description, hospitalId } = req.body;

        if (!recordsDB[recordId] || recordsDB[recordId].isDeleted) {
            return res.status(404).json({ error: "Record not found or deleted" });
        }

        // 1. Encrypt New Data
        const encryptedData = encrypt(JSON.stringify(clinicalData));

        // 2. Update Off-Chain
        recordsDB[recordId].encryptedData = encryptedData;
        recordsDB[recordId].version += 1;

        // 3. Hash New Data
        const dataHash = hashData(clinicalData);

        // 4. Update Fabric Metadata (Simulated 'UpdateMetadata' call)
        // In real chaincode, this would append a version to history
        const fabricTxId = await fabricService.submitTransaction('UpdateMetadata', recordId, dataHash, description || "Updated Record");

        // 5. Anchor NEW Hash to Ethereum (Append-only history)
        const txHash = await ethereumService.anchorHash(recordId, dataHash, hospitalId);

        res.json({
            success: true,
            message: "Record updated and re-anchored",
            version: recordsDB[recordId].version,
            fabricTxId,
            ethereumTx: txHash
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE: Soft Delete (Right to Erasure)
 * - Marks off-chain data as deleted (or wipes it)
 * - Calls SoftDelete on Fabric
 */
router.delete('/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;

        if (!recordsDB[recordId]) {
            return res.status(404).json({ error: "Record not found" });
        }

        // 1. Off-Chain Deletion (Logical or Physical)
        // For compliance, we wipe the data but keep the ID to prevent ID reuse collision
        recordsDB[recordId].encryptedData = "";
        recordsDB[recordId].isDeleted = true;

        // 2. Fabric Soft Delete (Immutable Audit Trail)
        const fabricTxId = await fabricService.submitTransaction('SoftDelete', recordId);

        res.json({
            success: true,
            message: "Record deleted (Right to Erasure)",
            fabricTxId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
