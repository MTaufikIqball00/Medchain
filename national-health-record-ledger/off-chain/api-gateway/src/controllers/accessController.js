const express = require('express');
const router = express.Router();
const config = require('../../config');

let fabricService;
if (config.BLOCKCHAIN_MODE === 'REAL') {
    fabricService = require('../services/realFabric');
} else {
    fabricService = require('../services/mockFabric');
}

/**
 * POST /access/request
 * Hospital requests access to a record.
 * Body: { recordId, requesterId }
 */
router.post('/request', async (req, res) => {
    try {
        const { recordId, requesterId } = req.body;
        if (!recordId || !requesterId) {
            return res.status(400).json({ error: "Missing recordId or requesterId" });
        }

        const txId = await fabricService.submitTransaction('RequestAccess', recordId, requesterId);

        res.json({
            success: true,
            message: "Access requested successfully",
            txId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /access/approve
 * Owner hospital grants access to another hospital.
 * Body: { recordId, targetHospitalId }
 * Note: In real app, we verify that the caller is the owner.
 */
router.post('/approve', async (req, res) => {
    try {
        const { recordId, targetHospitalId } = req.body;
        if (!recordId || !targetHospitalId) {
            return res.status(400).json({ error: "Missing recordId or targetHospitalId" });
        }

        const txId = await fabricService.submitTransaction('GrantAccess', recordId, targetHospitalId);

        res.json({
            success: true,
            message: "Access granted successfully",
            txId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
