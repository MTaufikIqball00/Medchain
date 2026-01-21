const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const config = require('./config');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
});

// Load Fabric Service based on config
let fabricService;
if (config.BLOCKCHAIN_MODE === 'REAL') {
    console.log("!!! RUNNING IN REAL HYPERLEDGER FABRIC MODE !!!");
    fabricService = require('./src/services/realFabric');
} else {
    console.log("--- RUNNING IN MOCK SIMULATION MODE (FABRIC) ---");
    fabricService = require('./src/services/mockFabric');
}

// In-memory record storage
const recordsDB = {};

// Routes
const patientRoutes = require('./src/controllers/patientController');
const recordRoutes = require('./src/controllers/recordController');

app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);

// ===== FABRIC API ROUTES =====

/**
 * POST /api/fabric/records
 * Create new medical record
 */
app.post('/api/fabric/records', async (req, res) => {
    try {
        console.log("[FABRIC] Creating record...", req.body);
        const { recordId, patientName, patientId, diagnosis, treatment, symptoms, department, doctorName, dataHash, isEncrypted } = req.body;

        // Validate required fields
        if (!patientId || !patientName) {
            return res.status(400).json({
                success: false,
                error: "patientId and patientName are required"
            });
        }

        const id = recordId || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        recordsDB[id] = {
            recordId: id,
            patientName,
            patientId,
            diagnosis,
            treatment,
            symptoms,
            department,
            doctorName,
            dataHash,
            isEncrypted: isEncrypted || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };

        console.log(`[FABRIC] Submitting to Fabric: ${id}`);
        const transactionId = await fabricService.submitTransaction('CreateRecord', id, patientId, patientName, dataHash);

        console.log(`[FABRIC] ✅ Record created: ${id}, TX: ${transactionId}`);

        return res.json({
            success: true,
            data: {
                recordId: id,
                transactionId: transactionId,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error("[FABRIC] ❌ Error creating record:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to create record"
        });
    }
});

/**
 * GET /api/fabric/records/:recordId
 * Get specific record
 */
app.get('/api/fabric/records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = recordsDB[recordId];

        if (!record) {
            return res.status(404).json({
                success: false,
                error: "Record not found"
            });
        }

        return res.json({
            success: true,
            data: record
        });

    } catch (error) {
        console.error("[FABRIC] Error querying record:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to query record"
        });
    }
});

/**
 * GET /api/fabric/records
 * Get all records
 */
app.get('/api/fabric/records', async (req, res) => {
    try {
        const records = Object.values(recordsDB);

        return res.json({
            success: true,
            data: records
        });

    } catch (error) {
        console.error("[FABRIC] Error fetching records:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to fetch records"
        });
    }
});

/**
 * GET /api/fabric/records/:recordId/history
 * Get transaction history for a record (by recordId OR fabricTxId)
 */
app.get('/api/fabric/records/:recordId/history', async (req, res) => {
    try {
        const { recordId } = req.params;
        
        // Try to find record by recordId or fabricTxId
        let record = recordsDB[recordId];
        
        if (!record) {
            // Try to find by fabricTxId
            record = Object.values(recordsDB).find(r => r.transactionId === recordId || r.fabricTxId === recordId);
        }

        if (!record) {
            // If still not found, return mock history for the TX ID
            return res.json({
                success: true,
                data: [{
                    transactionId: recordId,
                    functionName: 'CreateRecord',
                    timestamp: Date.now(),
                    status: 'COMMITTED'
                }]
            });
        }

        const history = await fabricService.getTransactionHistory(recordId);

        return res.json({
            success: true,
            data: history || [{
                transactionId: record.transactionId || record.fabricTxId,
                functionName: 'CreateRecord',
                timestamp: record.createdAt ? new Date(record.createdAt).getTime() : Date.now(),
                status: 'COMMITTED'
            }]
        });

    } catch (error) {
        console.error("[FABRIC] Error fetching transaction history:", error);
        return res.json({
            success: true,
            data: []
        });
    }
});

/**
 * PUT /api/fabric/records/:recordId
 * Update medical record
 */
app.put('/api/fabric/records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { diagnosis, treatment, symptoms, department, doctorName, dataHash } = req.body;

        const record = recordsDB[recordId];
        if (!record) {
            return res.status(404).json({
                success: false,
                error: "Record not found"
            });
        }

        record.diagnosis = diagnosis || record.diagnosis;
        record.treatment = treatment || record.treatment;
        record.symptoms = symptoms || record.symptoms;
        record.department = department || record.department;
        record.doctorName = doctorName || record.doctorName;
        record.dataHash = dataHash || record.dataHash;
        record.updatedAt = new Date().toISOString();
        record.version = (record.version || 1) + 1;

        const transactionId = await fabricService.submitTransaction('UpdateRecord', recordId, record.patientId, record.patientName, dataHash);

        console.log(`[FABRIC] ✅ Record updated: ${recordId}, TX: ${transactionId}`);

        return res.json({
            success: true,
            data: {
                recordId,
                transactionId,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error("[FABRIC] Error updating record:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to update record"
        });
    }
});

/**
 * DELETE /api/fabric/records/:recordId
 * Delete medical record
 */
app.delete('/api/fabric/records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = recordsDB[recordId];

        if (!record) {
            return res.status(404).json({
                success: false,
                error: "Record not found"
            });
        }

        record.isDeleted = true;
        record.updatedAt = new Date().toISOString();

        const transactionId = await fabricService.submitTransaction('DeleteRecord', recordId);

        console.log(`[FABRIC] ✅ Record deleted: ${recordId}, TX: ${transactionId}`);

        return res.json({
            success: true,
            data: {
                recordId,
                transactionId,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error("[FABRIC] Error deleting record:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to delete record"
        });
    }
});

/**
 * GET /api/fabric/health
 * Health check
 */
app.get('/api/fabric/health', async (req, res) => {
    try {
        return res.json({
            success: true,
            status: "Fabric API is running",
            mode: config.BLOCKCHAIN_MODE,
            recordCount: Object.keys(recordsDB).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Health check failed"
        });
    }
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.send('National Health Record Ledger Gateway is Running on port ' + port);
});

// 404 handler
app.use((req, res) => {
    console.log(`[API] ❌ 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.path}`,
        available: {
            posts: '/api/fabric/records',
            gets: '/api/fabric/records, /api/fabric/records/:id, /api/fabric/records/:id/history, /api/fabric/health',
            puts: '/api/fabric/records/:id',
            deletes: '/api/fabric/records/:id'
        }
    });
});

app.listen(port, () => {
    console.log(`\n✅ API Gateway listening at http://localhost:${port}`);
    console.log(`📍 Fabric API endpoints: /api/fabric/*`);
    console.log(`🔧 Mode: ${config.BLOCKCHAIN_MODE}\n`);
});
