const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const { encrypt, decrypt } = require('./src/utils/crypto');
require('dotenv').config();

const config = require('./config');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, patientDB, recordDB, accessPermissionDB } = require('./src/services/database');
const { authenticateHospital, optionalAuth } = require('./src/middleware/hospitalAuth');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[API] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Load services based on config
let fabricService;
let ethService;

if (config.BLOCKCHAIN_MODE === 'REAL') {
    console.log("!!! RUNNING IN REAL BLOCKCHAIN MODE !!!");
    fabricService = require('./src/services/realFabric');
    ethService = require('./src/services/realEthereum');
} else {
    console.log("--- RUNNING IN MOCK SIMULATION MODE ---");
    fabricService = require('./src/services/mockFabric');
    ethService = {
        anchorHash: async () => `MOCK_ETH_TX_${Date.now()}`,
        verifyIntegrity: async () => true,
        hasAccess: async () => true
    };
}

// Import controllers
const hospitalRoutes = require('./src/controllers/hospitalController');
const accessRoutes = require('./src/controllers/accessController');

// Mount routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/access', accessRoutes);

// Utility function to generate data hash
function generateDataHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// ===== PATIENT ENDPOINTS =====

/**
 * POST /api/patients
 * Create/register a new patient (off-chain PII storage)
 */
app.post('/api/patients', authenticateHospital, async (req, res) => {
    try {
        const { full_name, nik, date_of_birth, gender, address, phone, email } = req.body;

        if (!full_name) {
            return res.status(400).json({
                success: false,
                error: 'full_name is required'
            });
        }

        // Generate pseudonymized patient UID
        const patient_uid = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const patient = await patientDB.create({
            patient_uid,
            full_name,
            nik,
            date_of_birth,
            gender,
            address,
            phone,
            email,
            encrypted_data: null // Would encrypt sensitive data in production
        });

        console.log(`[PATIENT] ✅ Created: ${patient_uid} by ${req.hospital.hospital_id}`);

        return res.status(201).json({
            success: true,
            data: {
                patient_uid: patient.patient_uid,
                full_name: patient.full_name,
                created_at: patient.created_at
            }
        });

    } catch (error) {
        console.error('[PATIENT] Create error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create patient'
        });
    }
});

/**
 * GET /api/patients/:patientUid
 * Get patient by UID (requires auth)
 */
app.get('/api/patients/:patientUid', authenticateHospital, async (req, res) => {
    try {
        const patient = await patientDB.findByUid(req.params.patientUid);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Discovery: Find records for this patient (Blind Metadata)
        // This allows other hospitals to request access to specific records
        const records = await recordDB.findByPatient(req.params.patientUid);

        const discoveryRecords = records.map(r => ({
            record_id: r.record_id,
            hospital_id: r.hospital_id,
            created_at: r.created_at,
            department: r.department
        }));

        return res.json({
            success: true,
            data: {
                ...patient,
                medical_records: discoveryRecords
            }
        });

    } catch (error) {
        console.error('[PATIENT] Get error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get patient'
        });
    }
});

// ===== MEDICAL RECORD ENDPOINTS =====

/**
 * POST /api/fabric/records
 * Create new medical record
 */
app.post('/api/fabric/records', authenticateHospital, async (req, res) => {
    try {
        const { patient_uid, patient_name, diagnosis, treatment, symptoms, department, doctor_name } = req.body;
        const hospital = req.hospital;

        if (!patient_uid) {
            return res.status(400).json({
                success: false,
                error: 'patient_uid is required'
            });
        }

        // Verify patient exists OR Auto-create for Prototype
        let patient = await patientDB.findByUid(patient_uid);

        if (!patient) {
            console.log(`[FABRIC] Patient ${patient_uid} not found. Auto-registering...`);
            try {
                patient = await patientDB.create({
                    patient_uid,
                    full_name: patient_name || 'Patient ' + patient_uid,
                    nik: patient_uid,
                    date_of_birth: '1990-01-01',
                    gender: 'UNKNOWN',
                    address: 'Unknown',
                    phone: '-',
                    email: null,
                    encrypted_data: null
                });
            } catch (err) {
                console.error("Auto-registration failed:", err);
            }
        } else if (patient_name && patient.full_name !== patient_name && patient.full_name.startsWith('Patient ')) {
            // Update name if it was previously auto-generated
            try {
                await patientDB.update(patient_uid, { full_name: patient_name });
            } catch (e) { console.error("Failed to update patient name", e); }
        }

        // Double check
        if (!patient) {
            // If still failing, define a mock patient object so code doesn't crash
            patient = { patient_uid };
        }

        // Generate record ID and data hash
        const record_id = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const recordData = { patient_uid, diagnosis, treatment, symptoms, department, doctor_name, timestamp: Date.now() };
        const data_hash = generateDataHash(recordData);

        // Submit to Fabric
        console.log(`[FABRIC] Submitting record: ${record_id}`);
        const fabricTxId = await fabricService.submitTransaction('CreateRecord', record_id, patient_uid, hospital.hospital_id, data_hash);

        // Anchor hash to Ethereum
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            try {
                ethTxHash = await ethService.anchorHash(fabricTxId, data_hash, hospital.hospital_id);
            } catch (ethError) {
                console.error('[ETHEREUM] Anchor error (continuing):', ethError.message);
            }
        } else {
            ethTxHash = `MOCK_ETH_TX_${Date.now()}`;
        }

        // Save to PostgreSQL
        const record = await recordDB.create({
            record_id,
            patient_uid,
            hospital_id: hospital.hospital_id,
            fabric_tx_id: fabricTxId,
            eth_tx_hash: ethTxHash,
            diagnosis,
            treatment,
            symptoms,
            department,
            doctor_name,
            data_hash,
            is_encrypted: false
        });

        // Grant owner access
        await accessPermissionDB.grant({
            record_id,
            hospital_id: hospital.hospital_id,
            granted_by: hospital.hospital_id
        });

        console.log(`[FABRIC] ✅ Record created: ${record_id}, Fabric TX: ${fabricTxId}, ETH TX: ${ethTxHash}`);

        return res.status(201).json({
            success: true,
            data: {
                record_id: record.record_id,
                patient_uid: record.patient_uid,
                fabric_tx_id: fabricTxId,
                eth_tx_hash: ethTxHash,
                data_hash: data_hash,
                created_at: record.created_at
            }
        });

    } catch (error) {
        console.error('[FABRIC] Create error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create record'
        });
    }
});

/**
 * GET /api/fabric/records/:recordId
 * Get specific record (with access control)
 */
app.get('/api/fabric/records/:recordId', authenticateHospital, async (req, res) => {
    try {
        const { recordId } = req.params;
        const hospital = req.hospital;

        const record = await recordDB.findById(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Check access: owner or has permission
        const isOwner = record.hospital_id === hospital.hospital_id;
        const hasPermission = await accessPermissionDB.hasAccess(recordId, hospital.hospital_id);

        if (!isOwner && !hasPermission) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You do not have permission to view this record.',
                owner_hospital: record.hospital_id,
                hint: 'Use POST /api/access/request to request access from the owner hospital'
            });
        }

        // Get patient info
        const patient = await patientDB.findByUid(record.patient_uid);

        // Decrypt clinical data if needed
        let diagnosis = record.diagnosis;
        let treatment = record.treatment;
        let symptoms = record.symptoms;

        if (record.is_encrypted) {
            try {
                if (diagnosis) diagnosis = decrypt(diagnosis);
                if (treatment) treatment = decrypt(treatment);
                if (symptoms) symptoms = decrypt(symptoms);
            } catch (e) {
                console.error("Decryption failed for record " + recordId, e);
            }
        }

        return res.json({
            success: true,
            access_type: isOwner ? 'OWNER' : 'GRANTED',
            data: {
                ...record,
                diagnosis,
                treatment,
                symptoms,
                patient_name: patient?.full_name || 'Unknown'
            }
        });

    } catch (error) {
        console.error('[FABRIC] Get error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get record'
        });
    }
});

/**
 * GET /api/fabric/records
 * Get all records accessible to current hospital
 */
app.get('/api/fabric/records', authenticateHospital, async (req, res) => {
    try {
        const hospital = req.hospital;

        // Get owned records
        const ownedRecords = await recordDB.findByHospital(hospital.hospital_id);

        // Get records with granted access
        const grantedRecords = await accessPermissionDB.getAccessibleRecords(hospital.hospital_id);

        // Combine and deduplicate
        const allRecords = [...ownedRecords];
        for (const record of grantedRecords) {
            if (!allRecords.find(r => r.record_id === record.record_id)) {
                allRecords.push({ ...record, access_type: 'GRANTED' });
            }
        }

        // Mark owned records and fetch patient names
        const result = await Promise.all(allRecords.map(async r => {
            let patientName = 'Unknown';
            if (r.patient_uid) {
                const p = await patientDB.findByUid(r.patient_uid);
                if (p) patientName = p.full_name;
            }

            // Decrypt clinical data if needed
            let diagnosis = r.diagnosis;
            let treatment = r.treatment;
            let symptoms = r.symptoms;

            if (r.is_encrypted) {
                try {
                    if (diagnosis) diagnosis = decrypt(diagnosis);
                    if (treatment) treatment = decrypt(treatment);
                    if (symptoms) symptoms = decrypt(symptoms);
                } catch (e) {
                    console.error("Decryption failed for record " + r.record_id, e);
                    // Keep original if fail
                }
            }

            return {
                ...r,
                diagnosis,
                treatment,
                symptoms,
                patient_name: patientName,
                access_type: r.hospital_id === hospital.hospital_id ? 'OWNER' : 'GRANTED'
            };
        }));

        return res.json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error('[FABRIC] List error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to list records'
        });
    }
});

/**
 * GET /api/fabric/records/patient/:patientUid
 * Get all records for a patient (respecting access control)
 */
app.get('/api/fabric/records/patient/:patientUid', authenticateHospital, async (req, res) => {
    try {
        const { patientUid } = req.params;
        const hospital = req.hospital;

        const allRecords = await recordDB.findByPatient(patientUid);

        // Filter by access
        const accessibleRecords = [];
        for (const record of allRecords) {
            const isOwner = record.hospital_id === hospital.hospital_id;
            const hasPermission = await accessPermissionDB.hasAccess(record.record_id, hospital.hospital_id);

            if (isOwner || hasPermission) {
                accessibleRecords.push({
                    ...record,
                    access_type: isOwner ? 'OWNER' : 'GRANTED'
                });
            }
        }

        return res.json({
            success: true,
            patient_uid: patientUid,
            total_records: allRecords.length,
            accessible_records: accessibleRecords.length,
            data: accessibleRecords
        });

    } catch (error) {
        console.error('[FABRIC] Patient records error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get patient records'
        });
    }
});

/**
 * GET /api/fabric/records/:recordId/history
 * Get transaction history for a record
 */
app.get('/api/fabric/records/:recordId/history', authenticateHospital, async (req, res) => {
    try {
        const { recordId } = req.params;

        const record = await recordDB.findById(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Get Fabric transaction history
        let fabricHistory = [];
        if (config.BLOCKCHAIN_MODE === 'REAL' && fabricService.getTransactionHistory) {
            fabricHistory = await fabricService.getTransactionHistory(recordId);
        }

        // Get Ethereum proof
        let ethProof = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && ethService.getProof) {
            ethProof = await ethService.getProof(record.fabric_tx_id);
        }

        return res.json({
            success: true,
            data: {
                record_id: recordId,
                fabric_tx_id: record.fabric_tx_id,
                eth_tx_hash: record.eth_tx_hash,
                fabric_history: fabricHistory.length > 0 ? fabricHistory : [{
                    transaction_id: record.fabric_tx_id,
                    function: 'CreateRecord',
                    timestamp: record.created_at,
                    status: 'COMMITTED'
                }],
                ethereum_proof: ethProof || {
                    anchored: !!record.eth_tx_hash,
                    tx_hash: record.eth_tx_hash
                }
            }
        });

    } catch (error) {
        console.error('[FABRIC] History error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get transaction history'
        });
    }
});

/**
 * PUT /api/fabric/records/:recordId
 * Update a medical record (owner only)
 */
app.put('/api/fabric/records/:recordId', authenticateHospital, async (req, res) => {
    try {
        const { recordId } = req.params;
        const { diagnosis, treatment, symptoms, department, doctor_name } = req.body;
        const hospital = req.hospital;

        const record = await recordDB.findById(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        if (record.hospital_id !== hospital.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'Only the record owner can update this record'
            });
        }

        // Generate new data hash
        const newData = {
            ...record,
            diagnosis: diagnosis || record.diagnosis,
            treatment: treatment || record.treatment,
            symptoms: symptoms || record.symptoms,
            department: department || record.department,
            doctor_name: doctor_name || record.doctor_name,
            updated_at: Date.now()
        };
        const new_data_hash = generateDataHash(newData);

        // Submit to Fabric
        const fabricTxId = await fabricService.submitTransaction('UpdateRecord', recordId, record.patient_uid, hospital.hospital_id, new_data_hash);

        // Update in database
        const updated = await recordDB.update(recordId, {
            diagnosis: diagnosis || record.diagnosis,
            treatment: treatment || record.treatment,
            symptoms: symptoms || record.symptoms,
            department: department || record.department,
            doctor_name: doctor_name || record.doctor_name,
            data_hash: new_data_hash,
            fabric_tx_id: fabricTxId
        });

        console.log(`[FABRIC] ✅ Record updated: ${recordId}, TX: ${fabricTxId}`);

        return res.json({
            success: true,
            data: {
                record_id: updated.record_id,
                fabric_tx_id: fabricTxId,
                version: updated.version,
                updated_at: updated.updated_at
            }
        });

    } catch (error) {
        console.error('[FABRIC] Update error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update record'
        });
    }
});

/**
 * DELETE /api/fabric/records/:recordId
 * Soft delete a record (owner only)
 */
app.delete('/api/fabric/records/:recordId', authenticateHospital, async (req, res) => {
    try {
        const { recordId } = req.params;
        const hospital = req.hospital;

        const record = await recordDB.findById(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        if (record.hospital_id !== hospital.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'Only the record owner can delete this record'
            });
        }

        // Submit to Fabric
        const fabricTxId = await fabricService.submitTransaction('DeleteRecord', recordId);

        // Soft delete in database
        await recordDB.softDelete(recordId);

        console.log(`[FABRIC] ✅ Record deleted: ${recordId}, TX: ${fabricTxId}`);

        return res.json({
            success: true,
            data: {
                record_id: recordId,
                fabric_tx_id: fabricTxId,
                deleted_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[FABRIC] Delete error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete record'
        });
    }
});

// ===== VERIFICATION ENDPOINTS =====

/**
 * POST /api/verify/integrity
 * Verify data integrity using Ethereum anchor
 */
app.post('/api/verify/integrity', async (req, res) => {
    try {
        const { record_id, data_hash } = req.body;

        if (!record_id || !data_hash) {
            return res.status(400).json({
                success: false,
                error: 'record_id and data_hash are required'
            });
        }

        const record = await recordDB.findById(record_id);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Verify against Ethereum
        let ethVerified = false;
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            ethVerified = await ethService.verifyIntegrity(record.fabric_tx_id, data_hash);
        } else {
            ethVerified = record.data_hash === data_hash;
        }

        return res.json({
            success: true,
            data: {
                record_id,
                is_valid: ethVerified,
                stored_hash: record.data_hash,
                provided_hash: data_hash,
                fabric_tx_id: record.fabric_tx_id,
                eth_tx_hash: record.eth_tx_hash
            }
        });

    } catch (error) {
        console.error('[VERIFY] Integrity error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to verify integrity'
        });
    }
});

// ===== HEALTH & INFO ENDPOINTS =====

/**
 * GET /api/fabric/health
 * Health check
 */
app.get('/api/fabric/health', async (req, res) => {
    try {
        const allRecords = await recordDB.getAll();

        return res.json({
            success: true,
            status: 'API Gateway is running',
            mode: config.BLOCKCHAIN_MODE,
            database: 'PostgreSQL',
            record_count: allRecords.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.json({
            success: true,
            status: 'API Gateway is running (DB connection pending)',
            mode: config.BLOCKCHAIN_MODE,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        name: 'National Health Record Ledger Gateway',
        version: '2.0.0',
        mode: config.BLOCKCHAIN_MODE,
        endpoints: {
            hospitals: '/api/hospitals',
            records: '/api/fabric/records',
            access: '/api/access',
            patients: '/api/patients',
            verify: '/api/verify/integrity',
            health: '/api/fabric/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`[API] ❌ 404: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.path}`
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('\n🔄 Initializing database...');
        await initializeDatabase();

        app.listen(port, () => {
            console.log(`\n✅ API Gateway listening at http://localhost:${port}`);
            console.log(`📍 Mode: ${config.BLOCKCHAIN_MODE}`);
            console.log(`📍 Database: PostgreSQL`);
            console.log(`\n📋 Available endpoints:`);
            console.log(`   POST   /api/hospitals/register`);
            console.log(`   POST   /api/hospitals/login`);
            console.log(`   POST   /api/patients`);
            console.log(`   POST   /api/fabric/records`);
            console.log(`   GET    /api/fabric/records`);
            console.log(`   GET    /api/fabric/records/:id`);
            console.log(`   POST   /api/access/request`);
            console.log(`   POST   /api/access/grant`);
            console.log(`   GET    /api/fabric/health\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
