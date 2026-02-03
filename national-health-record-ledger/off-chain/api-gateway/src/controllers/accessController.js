const express = require('express');
const router = express.Router();
const { recordDB, accessRequestDB, accessPermissionDB, hospitalDB } = require('../services/database');
const { authenticateHospital } = require('../middleware/hospitalAuth');
const ethService = require('../services/realEthereum');
const config = require('../../config');

/**
 * POST /api/access/request
 * Request access to a medical record from another hospital
 */
router.post('/request', authenticateHospital, async (req, res) => {
    try {
        const { record_id, reason } = req.body;
        const requester = req.hospital;

        if (!record_id) {
            return res.status(400).json({
                success: false,
                error: 'record_id is required'
            });
        }

        // Find the record
        const record = await recordDB.findById(record_id);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Check if requesting own record
        if (record.hospital_id === requester.hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot request access to your own record'
            });
        }

        // Check if already has access
        const hasAccess = await accessPermissionDB.hasAccess(record_id, requester.hospital_id);
        if (hasAccess) {
            return res.status(400).json({
                success: false,
                error: 'You already have access to this record'
            });
        }

        // Check for existing pending request
        const existingRequest = await accessRequestDB.findByRecordAndRequester(record_id, requester.hospital_id);
        if (existingRequest && existingRequest.status === 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'You already have a pending request for this record'
            });
        }

        // Submit to Ethereum if in REAL mode
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && requester.eth_address) {
            try {
                const ownerHospital = await hospitalDB.findById(record.hospital_id);
                if (ownerHospital && ownerHospital.eth_address) {
                    ethTxHash = await ethService.requestAccess(record_id, ownerHospital.eth_address, requester.eth_address);
                }
            } catch (ethError) {
                console.error('[ACCESS] Ethereum error (continuing):', ethError.message);
            }
        }

        // Create access request in database
        const accessRequest = await accessRequestDB.create({
            record_id,
            requester_hospital_id: requester.hospital_id,
            owner_hospital_id: record.hospital_id,
            eth_request_tx: ethTxHash,
            reason: reason || null
        });

        console.log(`[ACCESS] ✅ Access request created: ${requester.hospital_id} -> ${record.hospital_id} for record ${record_id}`);

        return res.status(201).json({
            success: true,
            message: 'Access request submitted successfully',
            data: {
                request_id: accessRequest.id,
                record_id: accessRequest.record_id,
                owner_hospital: accessRequest.owner_hospital_id,
                status: accessRequest.status,
                eth_tx_hash: ethTxHash,
                requested_at: accessRequest.requested_at
            }
        });

    } catch (error) {
        console.error('[ACCESS] Request error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create access request'
        });
    }
});

/**
 * GET /api/access/pending
 * Get pending access requests for current hospital
 */
router.get('/pending', authenticateHospital, async (req, res) => {
    try {
        const requests = await accessRequestDB.getPendingForHospital(req.hospital.hospital_id);

        return res.json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('[ACCESS] Get pending error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get pending requests'
        });
    }
});

/**
 * POST /api/access/grant
 * Grant access to a requesting hospital
 */
router.post('/grant', authenticateHospital, async (req, res) => {
    try {
        const { record_id, requester_hospital_id } = req.body;
        const owner = req.hospital;

        if (!record_id || !requester_hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'record_id and requester_hospital_id are required'
            });
        }

        // Verify ownership
        const record = await recordDB.findById(record_id);
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        if (record.hospital_id !== owner.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'You are not the owner of this record'
            });
        }

        // Check for pending request
        const request = await accessRequestDB.findByRecordAndRequester(record_id, requester_hospital_id);
        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'No pending request found from this hospital'
            });
        }

        // Submit to Ethereum if in REAL mode
        let ethTxHash = null;
        if (config.BLOCKCHAIN_MODE === 'REAL' && owner.eth_address) {
            try {
                const requesterHospital = await hospitalDB.findById(requester_hospital_id);
                if (requesterHospital && requesterHospital.eth_address) {
                    ethTxHash = await ethService.grantAccess(record_id, requesterHospital.eth_address, owner.eth_address);
                }
            } catch (ethError) {
                console.error('[ACCESS] Ethereum grant error (continuing):', ethError.message);
            }
        }

        // Update request status
        await accessRequestDB.updateStatus(record_id, requester_hospital_id, 'GRANTED', ethTxHash);

        // Create access permission
        await accessPermissionDB.grant({
            record_id,
            hospital_id: requester_hospital_id,
            granted_by: owner.hospital_id
        });

        console.log(`[ACCESS] ✅ Access granted: ${owner.hospital_id} granted ${requester_hospital_id} access to ${record_id}`);

        return res.json({
            success: true,
            message: 'Access granted successfully',
            data: {
                record_id,
                granted_to: requester_hospital_id,
                eth_tx_hash: ethTxHash,
                granted_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[ACCESS] Grant error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to grant access'
        });
    }
});

/**
 * POST /api/access/deny
 * Deny an access request
 */
router.post('/deny', authenticateHospital, async (req, res) => {
    try {
        const { record_id, requester_hospital_id, reason } = req.body;
        const owner = req.hospital;

        if (!record_id || !requester_hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'record_id and requester_hospital_id are required'
            });
        }

        // Verify ownership
        const record = await recordDB.findById(record_id);
        if (!record || record.hospital_id !== owner.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'You are not the owner of this record'
            });
        }

        // Update request status
        await accessRequestDB.updateStatus(record_id, requester_hospital_id, 'DENIED');

        console.log(`[ACCESS] ❌ Access denied: ${owner.hospital_id} denied ${requester_hospital_id} for ${record_id}`);

        return res.json({
            success: true,
            message: 'Access request denied',
            data: {
                record_id,
                denied_to: requester_hospital_id,
                denied_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[ACCESS] Deny error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to deny access'
        });
    }
});

/**
 * POST /api/access/revoke
 * Revoke previously granted access
 */
router.post('/revoke', authenticateHospital, async (req, res) => {
    try {
        const { record_id, hospital_id } = req.body;
        const owner = req.hospital;

        if (!record_id || !hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'record_id and hospital_id are required'
            });
        }

        // Verify ownership
        const record = await recordDB.findById(record_id);
        if (!record || record.hospital_id !== owner.hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'You are not the owner of this record'
            });
        }

        // Submit to Ethereum if in REAL mode
        if (config.BLOCKCHAIN_MODE === 'REAL' && owner.eth_address) {
            try {
                const targetHospital = await hospitalDB.findById(hospital_id);
                if (targetHospital && targetHospital.eth_address) {
                    await ethService.revokeAccess(record_id, targetHospital.eth_address, owner.eth_address);
                }
            } catch (ethError) {
                console.error('[ACCESS] Ethereum revoke error (continuing):', ethError.message);
            }
        }

        // Revoke in database
        await accessPermissionDB.revoke(record_id, hospital_id);

        console.log(`[ACCESS] ⚠️ Access revoked: ${owner.hospital_id} revoked ${hospital_id} from ${record_id}`);

        return res.json({
            success: true,
            message: 'Access revoked successfully',
            data: {
                record_id,
                revoked_from: hospital_id,
                revoked_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[ACCESS] Revoke error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to revoke access'
        });
    }
});

/**
 * GET /api/access/check/:recordId
 * Check if current hospital has access to a record
 */
router.get('/check/:recordId', authenticateHospital, async (req, res) => {
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

        // Owner always has access
        if (record.hospital_id === hospital.hospital_id) {
            return res.json({
                success: true,
                has_access: true,
                access_type: 'OWNER',
                record_id: recordId
            });
        }

        // Check permission
        const hasAccess = await accessPermissionDB.hasAccess(recordId, hospital.hospital_id);

        return res.json({
            success: true,
            has_access: hasAccess,
            access_type: hasAccess ? 'GRANTED' : 'NONE',
            record_id: recordId
        });

    } catch (error) {
        console.error('[ACCESS] Check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check access'
        });
    }
});

module.exports = router;
