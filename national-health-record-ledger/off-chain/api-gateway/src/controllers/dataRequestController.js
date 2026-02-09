const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { recordDB, hospitalDB, patientDB } = require('../services/database');
const { authenticateHospital } = require('../middleware/hospitalAuth');
const dataRequestEthService = require('../services/dataRequestEthereum');
const fabricService = require('../services/realFabric');
const config = require('../../config');

// In-memory store for data requests (would be in PostgreSQL in production)
const dataRequestStore = new Map();

/**
 * Generate pseudonymized patient UID hash (SHA-256)
 */
function hashPatientUID(patientUID) {
    return crypto.createHash('sha256').update(patientUID).digest('hex');
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `DREQ-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

/**
 * POST /api/data-request/create
 * Create a new cross-hospital data request
 * 
 * Body:
 * - targetHospitalId: string (required)
 * - patientUID: string (required)
 * - purpose: string (required)
 * - requestedDataTypes: string[] (optional)
 */
router.post('/create', authenticateHospital, async (req, res) => {
    try {
        const { targetHospitalId, patientUID, purpose, requestedDataTypes = [] } = req.body;
        const requester = req.hospital;

        // Validation
        if (!targetHospitalId) {
            return res.status(400).json({
                success: false,
                error: 'targetHospitalId is required'
            });
        }

        if (!patientUID) {
            return res.status(400).json({
                success: false,
                error: 'patientUID is required'
            });
        }

        if (!purpose) {
            return res.status(400).json({
                success: false,
                error: 'purpose is required'
            });
        }

        // Cannot request from self
        if (targetHospitalId === requester.hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot request data from your own hospital'
            });
        }

        // Verify target hospital exists
        const targetHospital = await hospitalDB.findById(targetHospitalId);
        if (!targetHospital) {
            return res.status(404).json({
                success: false,
                error: `Target hospital '${targetHospitalId}' not found`
            });
        }

        // Generate request ID and hash patient UID
        const requestId = generateRequestId();
        const patientUIDHash = hashPatientUID(patientUID);

        // Submit to Ethereum if in REAL mode
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && requester.eth_address && targetHospital.eth_address) {
            try {
                ethTxHash = await dataRequestEthService.createDataRequest(
                    requestId,
                    targetHospital.eth_address,
                    patientUIDHash,
                    purpose,
                    requester.hospital_id
                );
                console.log(`[DATA-REQUEST] ✅ Ethereum TX: ${ethTxHash}`);
            } catch (ethError) {
                console.error('[DATA-REQUEST] Ethereum error:', ethError.message);
                // Continue without blockchain - fallback to off-chain only
            }
        }

        // Submit to Hyperledger Fabric for audit trail
        let fabricTxId = null;
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            try {
                fabricTxId = await fabricService.submitTransaction(
                    'CreateDataRequest',
                    requestId,
                    requester.hospital_id,
                    targetHospitalId,
                    patientUIDHash,
                    purpose
                );
                console.log(`[DATA-REQUEST] ✅ Fabric TX: ${fabricTxId}`);
            } catch (fabricError) {
                console.error('[DATA-REQUEST] Fabric error (continuing):', fabricError.message);
            }
        }

        // Store request in memory (would be PostgreSQL in production)
        const dataRequest = {
            request_id: requestId,
            requesting_hospital_id: requester.hospital_id,
            target_hospital_id: targetHospitalId,
            patient_uid_hash: patientUIDHash,
            purpose,
            requested_data_types: requestedDataTypes,
            status: 'PENDING',
            eth_tx_hash: ethTxHash,
            fabric_tx_id: fabricTxId,
            data_hash: null,
            requested_at: new Date().toISOString(),
            approved_at: null,
            expires_at: null
        };

        dataRequestStore.set(requestId, dataRequest);

        console.log(`[DATA-REQUEST] ✅ Request created: ${requestId}`);
        console.log(`   From: ${requester.hospital_id} -> To: ${targetHospitalId}`);
        console.log(`   Purpose: ${purpose}`);

        return res.status(201).json({
            success: true,
            message: 'Data request created successfully',
            data: {
                request_id: requestId,
                requesting_hospital: requester.hospital_id,
                target_hospital: targetHospitalId,
                patient_uid_hash: patientUIDHash,
                purpose,
                requested_data_types: requestedDataTypes,
                status: 'PENDING',
                eth_tx_hash: ethTxHash,
                fabric_tx_id: fabricTxId,
                requested_at: dataRequest.requested_at
            }
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Create error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create data request'
        });
    }
});

/**
 * POST /api/data-request/approve/:requestId
 * Approve a pending data request
 */
router.post('/approve/:requestId', authenticateHospital, async (req, res) => {
    try {
        const { requestId } = req.params;
        const approver = req.hospital;

        // Get request
        const dataRequest = dataRequestStore.get(requestId);
        if (!dataRequest) {
            return res.status(404).json({
                success: false,
                error: 'Request not found'
            });
        }

        // Verify approver is the target hospital
        if (dataRequest.target_hospital_id !== approver.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'Only the target hospital can approve this request'
            });
        }

        // Check if already processed
        if (dataRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${dataRequest.status}`
            });
        }

        // Submit to Ethereum
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && approver.eth_address) {
            try {
                ethTxHash = await dataRequestEthService.approveDataRequest(
                    requestId,
                    approver.hospital_id
                );
                console.log(`[DATA-REQUEST] ✅ Approve Ethereum TX: ${ethTxHash}`);
            } catch (ethError) {
                console.error('[DATA-REQUEST] Ethereum approve error:', ethError.message);
            }
        }

        // Update request
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        dataRequest.status = 'APPROVED';
        dataRequest.approved_at = now.toISOString();
        dataRequest.expires_at = expiresAt.toISOString();
        dataRequest.approve_tx_hash = ethTxHash;

        // Record in Fabric audit trail
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            try {
                await fabricService.submitTransaction(
                    'ApproveDataRequest',
                    requestId,
                    approver.hospital_id,
                    dataRequest.approved_at
                );
            } catch (fabricError) {
                console.error('[DATA-REQUEST] Fabric approve error (continuing):', fabricError.message);
            }
        }

        console.log(`[DATA-REQUEST] ✅ Request approved: ${requestId}`);
        console.log(`   Expires at: ${expiresAt.toISOString()}`);

        return res.json({
            success: true,
            message: 'Request approved successfully',
            data: {
                request_id: requestId,
                status: 'APPROVED',
                approved_at: dataRequest.approved_at,
                expires_at: dataRequest.expires_at,
                eth_tx_hash: ethTxHash,
                access_duration_hours: 24
            }
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Approve error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to approve request'
        });
    }
});

/**
 * POST /api/data-request/reject/:requestId
 * Reject a pending data request
 */
router.post('/reject/:requestId', authenticateHospital, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const rejecter = req.hospital;

        // Get request
        const dataRequest = dataRequestStore.get(requestId);
        if (!dataRequest) {
            return res.status(404).json({
                success: false,
                error: 'Request not found'
            });
        }

        // Verify rejecter is the target hospital
        if (dataRequest.target_hospital_id !== rejecter.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'Only the target hospital can reject this request'
            });
        }

        // Check if already processed
        if (dataRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${dataRequest.status}`
            });
        }

        // Submit to Ethereum
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && rejecter.eth_address) {
            try {
                ethTxHash = await dataRequestEthService.rejectDataRequest(
                    requestId,
                    rejecter.hospital_id
                );
                console.log(`[DATA-REQUEST] ✅ Reject Ethereum TX: ${ethTxHash}`);
            } catch (ethError) {
                console.error('[DATA-REQUEST] Ethereum reject error:', ethError.message);
            }
        }

        // Update request
        dataRequest.status = 'REJECTED';
        dataRequest.rejected_at = new Date().toISOString();
        dataRequest.rejection_reason = reason || null;
        dataRequest.reject_tx_hash = ethTxHash;

        // Record in Fabric audit trail
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            try {
                await fabricService.submitTransaction(
                    'RejectDataRequest',
                    requestId,
                    rejecter.hospital_id,
                    reason || 'No reason provided'
                );
            } catch (fabricError) {
                console.error('[DATA-REQUEST] Fabric reject error (continuing):', fabricError.message);
            }
        }

        console.log(`[DATA-REQUEST] ❌ Request rejected: ${requestId}`);

        return res.json({
            success: true,
            message: 'Request rejected',
            data: {
                request_id: requestId,
                status: 'REJECTED',
                rejected_at: dataRequest.rejected_at,
                reason: reason || null,
                eth_tx_hash: ethTxHash
            }
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Reject error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to reject request'
        });
    }
});

/**
 * GET /api/data-request/status/:requestId
 * Get status of a data request
 */
router.get('/status/:requestId', authenticateHospital, async (req, res) => {
    try {
        const { requestId } = req.params;
        const hospital = req.hospital;

        // Get request
        const dataRequest = dataRequestStore.get(requestId);
        if (!dataRequest) {
            return res.status(404).json({
                success: false,
                error: 'Request not found'
            });
        }

        // Verify requester is involved in this request
        const isRequester = dataRequest.requesting_hospital_id === hospital.hospital_id;
        const isTarget = dataRequest.target_hospital_id === hospital.hospital_id;

        if (!isRequester && !isTarget) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to view this request'
            });
        }

        // Check expiration
        let currentStatus = dataRequest.status;
        let isAccessActive = false;

        if (currentStatus === 'APPROVED' && dataRequest.expires_at) {
            const expiresAt = new Date(dataRequest.expires_at);
            if (new Date() > expiresAt) {
                currentStatus = 'EXPIRED';
            } else {
                isAccessActive = true;
            }
        }

        // Query blockchain for verification if in REAL mode
        let blockchainStatus = null;
        if (config.BLOCKCHAIN_MODE === 'REAL') {
            try {
                blockchainStatus = await dataRequestEthService.getDataRequestStatus(requestId);
            } catch (ethError) {
                console.error('[DATA-REQUEST] Blockchain status check error:', ethError.message);
            }
        }

        return res.json({
            success: true,
            data: {
                request_id: requestId,
                requesting_hospital: dataRequest.requesting_hospital_id,
                target_hospital: dataRequest.target_hospital_id,
                status: currentStatus,
                is_access_active: isAccessActive,
                purpose: dataRequest.purpose,
                requested_data_types: dataRequest.requested_data_types,
                requested_at: dataRequest.requested_at,
                approved_at: dataRequest.approved_at,
                expires_at: dataRequest.expires_at,
                rejected_at: dataRequest.rejected_at,
                rejection_reason: dataRequest.rejection_reason,
                eth_tx_hash: dataRequest.eth_tx_hash,
                fabric_tx_id: dataRequest.fabric_tx_id,
                blockchain_verified: blockchainStatus ? true : false,
                your_role: isRequester ? 'REQUESTER' : 'TARGET'
            }
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Status error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get request status'
        });
    }
});

/**
 * GET /api/data-request/pending
 * Get all pending requests for current hospital (as target)
 */
router.get('/pending', authenticateHospital, async (req, res) => {
    try {
        const hospital = req.hospital;

        const pendingRequests = [];
        for (const [requestId, request] of dataRequestStore) {
            if (request.target_hospital_id === hospital.hospital_id && request.status === 'PENDING') {
                pendingRequests.push({
                    request_id: requestId,
                    requesting_hospital: request.requesting_hospital_id,
                    purpose: request.purpose,
                    requested_data_types: request.requested_data_types,
                    requested_at: request.requested_at
                });
            }
        }

        return res.json({
            success: true,
            count: pendingRequests.length,
            data: pendingRequests
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Pending list error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get pending requests'
        });
    }
});

/**
 * GET /api/data-request/my-requests
 * Get all requests made by current hospital
 */
router.get('/my-requests', authenticateHospital, async (req, res) => {
    try {
        const hospital = req.hospital;

        const myRequests = [];
        for (const [requestId, request] of dataRequestStore) {
            if (request.requesting_hospital_id === hospital.hospital_id) {
                // Check expiration
                let currentStatus = request.status;
                if (currentStatus === 'APPROVED' && request.expires_at) {
                    if (new Date() > new Date(request.expires_at)) {
                        currentStatus = 'EXPIRED';
                    }
                }

                myRequests.push({
                    request_id: requestId,
                    target_hospital: request.target_hospital_id,
                    status: currentStatus,
                    purpose: request.purpose,
                    requested_at: request.requested_at,
                    approved_at: request.approved_at,
                    expires_at: request.expires_at
                });
            }
        }

        return res.json({
            success: true,
            count: myRequests.length,
            data: myRequests
        });

    } catch (error) {
        console.error('[DATA-REQUEST] My requests error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get your requests'
        });
    }
});

/**
 * POST /api/data-request/anchor-hash/:requestId
 * Anchor data hash after approval (for integrity verification)
 */
router.post('/anchor-hash/:requestId', authenticateHospital, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { dataHash } = req.body;
        const hospital = req.hospital;

        if (!dataHash) {
            return res.status(400).json({
                success: false,
                error: 'dataHash is required'
            });
        }

        // Get request
        const dataRequest = dataRequestStore.get(requestId);
        if (!dataRequest) {
            return res.status(404).json({
                success: false,
                error: 'Request not found'
            });
        }

        // Verify caller is the target hospital
        if (dataRequest.target_hospital_id !== hospital.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'Only the target hospital can anchor data hash'
            });
        }

        // Check if approved and not expired
        if (dataRequest.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                error: 'Request must be approved to anchor data hash'
            });
        }

        if (dataRequest.expires_at && new Date() > new Date(dataRequest.expires_at)) {
            return res.status(400).json({
                success: false,
                error: 'Access has expired'
            });
        }

        // Submit to Ethereum
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && hospital.eth_address) {
            try {
                ethTxHash = await dataRequestEthService.anchorDataHash(
                    requestId,
                    dataHash,
                    hospital.hospital_id
                );
                console.log(`[DATA-REQUEST] ✅ Anchor hash Ethereum TX: ${ethTxHash}`);
            } catch (ethError) {
                console.error('[DATA-REQUEST] Ethereum anchor error:', ethError.message);
            }
        }

        // Update request
        dataRequest.data_hash = dataHash;
        dataRequest.anchor_tx_hash = ethTxHash;

        console.log(`[DATA-REQUEST] ✅ Data hash anchored for: ${requestId}`);

        return res.json({
            success: true,
            message: 'Data hash anchored successfully',
            data: {
                request_id: requestId,
                data_hash: dataHash,
                eth_tx_hash: ethTxHash
            }
        });

    } catch (error) {
        console.error('[DATA-REQUEST] Anchor hash error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to anchor data hash'
        });
    }
});

module.exports = router;
