const express = require('express');
const router = express.Router();
const { patientDB } = require('../services/database');
const { generatePatientUID } = require('../utils/crypto');

router.post('/register', async (req, res) => {
    try {
        const { nik, name, dob, placeOfBirth, bloodType, gender, address, phone, email, hospitalId } = req.body;

        // 1. Generate Pseudonym
        const patientUid = generatePatientUID(nik);

        // 2. Store PII Off-Chain (Real PostgreSQL DB)
        const newPatient = await patientDB.create({
            patient_uid: patientUid,
            full_name: name,
            nik,
            date_of_birth: dob,
            place_of_birth: placeOfBirth,
            blood_type: bloodType,
            gender,
            address,
            phone,
            email,
            encrypted_data: null // Optional: Implement encryption logic later if needed
        });

        console.log(`[OFF-CHAIN] Patient Registered: ${name} -> UID: ${patientUid}`);

        // Return only UID to the frontend/hospital
        res.json({
            success: true,
            patientUid,
            message: "Patient registered successfully. Use UID for all future transactions."
        });
    } catch (error) {
        console.error('[OFF-CHAIN] Registration Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to register patient",
            error: error.message
        });
    }
});

module.exports = router;
