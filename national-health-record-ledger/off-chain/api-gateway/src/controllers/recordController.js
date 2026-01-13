const express = require('express');
const router = express.Router();
const { encrypt, hashData } = require('../utils/crypto');
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

// Mock Off-Chain Storage
const recordsDB = {};

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
            hospitalId
        };
        const offChainLoc = `https://api.hospital-node.com/records/${recordId}`;

        // 4. Create Integrity Hash (SHA-256)
        const dataHash = hashData(clinicalData);

        // 5. Submit Metadata to Hyperledger Fabric
        let fabricTxId;
        if (config.BLOCKCHAIN_MODE === 'REAL') {
             fabricTxId = await fabricService.submitTransaction('CreateMetadata', recordId, patientUid, hospitalId, offChainLoc, dataHash, description);
        } else {
             fabricTxId = await fabricService.submitTransaction('CreateMetadata', recordId, patientUid, hospitalId, offChainLoc, dataHash, description);
        }

        // 6. Anchor Hash to Ethereum
        const txHash = await ethereumService.anchorHash(recordId, dataHash, hospitalId);

        res.json({
            success: true,
            recordId,
            fabricTxId,
            ethereumTx: txHash,
            message: config.BLOCKCHAIN_MODE === 'REAL' ? "Record secured on LIVE Hybrid Ledger" : "Record secured on SIMULATED Ledger"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
