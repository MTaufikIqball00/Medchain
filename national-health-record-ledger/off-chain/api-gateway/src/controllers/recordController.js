const express = require('express');
const router = express.Router();
const { encrypt, decrypt, hashData } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const { getRecord, saveRecord } = require('../utils/db');

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

        // 3. Save Off-Chain (Persistent)
        const recordData = {
            patientUid,
            encryptedData,
            hospitalId,
            version: 1,
            isDeleted: false
        };
        saveRecord(recordId, recordData);

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
        const requesterId = req.headers['x-hospital-id'] || req.query.requesterId; // Expect requester ID in header or query

        if (!requesterId) {
             return res.status(401).json({ error: "Missing x-hospital-id header or requesterId query param" });
        }

        const record = getRecord(recordId);

        if (!record) {
            return res.status(404).json({ error: "Record not found off-chain" });
        }

        if (record.isDeleted) {
            return res.status(410).json({ error: "Record has been deleted (Right to Erasure applied)" });
        }

        // Verify Access Control via Chaincode
        // This will throw if access is denied
        await fabricService.evaluateTransaction('ReadMetadata', recordId, requesterId);

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
        if (error.message.includes("Access denied")) {
            return res.status(403).json({ error: error.message });
        }
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

        const record = getRecord(recordId);

        if (!record || record.isDeleted) {
            return res.status(404).json({ error: "Record not found or deleted" });
        }

        // 1. Encrypt New Data
        const encryptedData = encrypt(JSON.stringify(clinicalData));

        // 2. Update Off-Chain
        record.encryptedData = encryptedData;
        record.version += 1;
        saveRecord(recordId, record);

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
            version: record.version,
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
        const record = getRecord(recordId);

        if (!record) {
            return res.status(404).json({ error: "Record not found" });
        }

        // 1. Off-Chain Deletion (Logical or Physical)
        // For compliance, we wipe the data but keep the ID to prevent ID reuse collision
        record.encryptedData = "";
        record.isDeleted = true;
        saveRecord(recordId, record);

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

/**
 * VERIFY: Check Data Integrity
 * - Hashes input data
 * - Compares with On-Chain Metadata Hash
 */
router.post('/verify', async (req, res) => {
    try {
        const { recordId, clinicalData, requesterId } = req.body;

        if (!recordId || !clinicalData || !requesterId) {
            return res.status(400).json({ error: "Missing recordId, clinicalData, or requesterId" });
        }

        // 1. Calculate Hash of Provided Data
        const calculatedHash = hashData(clinicalData);

        // 2. Fetch On-Chain Metadata (Access Control Enforced)
        const metadataBuffer = await fabricService.evaluateTransaction('ReadMetadata', recordId, requesterId);
        const metadata = JSON.parse(metadataBuffer.toString());

        // 3. Compare
        const isMatch = (calculatedHash === metadata.dataHash);

        res.json({
            success: true,
            isMatch,
            recordId,
            onChainHash: metadata.dataHash,
            calculatedHash
        });

    } catch (error) {
        console.error(error);
        if (error.message.includes("Access denied")) {
            return res.status(403).json({ error: "Access Denied: Cannot verify record you do not have access to." });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
