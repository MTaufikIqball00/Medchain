const express = require('express');
const router = express.Router();
const { generatePatientUID } = require('../utils/crypto');
// Mock Database
const patientsDB = {}; // Off-chain mapping NIK -> Data

router.post('/register', async (req, res) => {
    const { nik, name, dob, address, hospitalId } = req.body;

    // 1. Generate Pseudonym
    const patientUid = await generatePatientUID(nik);

    // 2. Store PII Off-Chain (Mock DB)
    // In real system: Encrypted SQL Row
    patientsDB[patientUid] = {
        name,
        dob,
        address, // PII
        hospitalId,
        registeredAt: Date.now()
    };

    console.log(`[OFF-CHAIN] Patient Registered: ${name} -> UID: ${patientUid}`);

    // Return only UID to the frontend/hospital
    res.json({
        success: true,
        patientUid,
        message: "Patient registered successfully. Use UID for all future transactions."
    });
});

module.exports = router;
