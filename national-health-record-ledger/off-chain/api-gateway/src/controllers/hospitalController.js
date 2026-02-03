const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { hospitalDB } = require('../services/database');
const { generateToken, authenticateHospital } = require('../middleware/hospitalAuth');

/**
 * POST /api/hospitals/register
 * Register a new hospital
 */
router.post('/register', async (req, res) => {
    try {
        const { hospital_id, name, eth_address, password } = req.body;

        // Validate required fields
        if (!hospital_id || !name || !password) {
            return res.status(400).json({
                success: false,
                error: 'hospital_id, name, and password are required'
            });
        }

        // Check if hospital already exists
        const existing = await hospitalDB.findById(hospital_id);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Hospital ID already registered'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create hospital
        const hospital = await hospitalDB.create({
            hospital_id,
            name,
            eth_address: eth_address || null,
            password_hash
        });

        console.log(`[HOSPITAL] ✅ Registered: ${hospital_id} - ${name}`);

        return res.status(201).json({
            success: true,
            message: 'Hospital registered successfully',
            data: {
                hospital_id: hospital.hospital_id,
                name: hospital.name,
                eth_address: hospital.eth_address,
                created_at: hospital.created_at
            }
        });

    } catch (error) {
        console.error('[HOSPITAL] Registration error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to register hospital'
        });
    }
});

/**
 * POST /api/hospitals/login
 * Login hospital and get JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { hospital_id, password } = req.body;

        if (!hospital_id || !password) {
            return res.status(400).json({
                success: false,
                error: 'hospital_id and password are required'
            });
        }

        // Find hospital
        const hospital = await hospitalDB.findById(hospital_id);
        if (!hospital) {
            return res.status(401).json({
                success: false,
                error: 'Invalid hospital ID or password'
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, hospital.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid hospital ID or password'
            });
        }

        // Generate JWT token
        const token = generateToken(hospital);

        console.log(`[HOSPITAL] ✅ Login: ${hospital_id}`);

        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                hospital_id: hospital.hospital_id,
                name: hospital.name,
                eth_address: hospital.eth_address,
                token: token,
                expires_in: '24h'
            }
        });

    } catch (error) {
        console.error('[HOSPITAL] Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

/**
 * GET /api/hospitals/me
 * Get current hospital info (requires auth)
 */
router.get('/me', authenticateHospital, async (req, res) => {
    try {
        const hospital = await hospitalDB.findById(req.hospital.hospital_id);

        return res.json({
            success: true,
            data: {
                hospital_id: hospital.hospital_id,
                name: hospital.name,
                eth_address: hospital.eth_address,
                created_at: hospital.created_at
            }
        });

    } catch (error) {
        console.error('[HOSPITAL] Get profile error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get hospital profile'
        });
    }
});

/**
 * GET /api/hospitals
 * List all registered hospitals (public)
 */
router.get('/', async (req, res) => {
    try {
        const hospitals = await hospitalDB.getAll();

        return res.json({
            success: true,
            count: hospitals.length,
            data: hospitals
        });

    } catch (error) {
        console.error('[HOSPITAL] List error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to list hospitals'
        });
    }
});

/**
 * PUT /api/hospitals/eth-address
 * Update hospital Ethereum address (requires auth)
 */
router.put('/eth-address', authenticateHospital, async (req, res) => {
    try {
        const { eth_address } = req.body;

        if (!eth_address) {
            return res.status(400).json({
                success: false,
                error: 'eth_address is required'
            });
        }

        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(eth_address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address format'
            });
        }

        // Update in database (would need to add update method)
        const { pool } = require('../services/database');
        await pool.query(
            'UPDATE hospitals SET eth_address = $1, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = $2',
            [eth_address, req.hospital.hospital_id]
        );

        console.log(`[HOSPITAL] ✅ Updated ETH address for ${req.hospital.hospital_id}: ${eth_address}`);

        return res.json({
            success: true,
            message: 'Ethereum address updated',
            data: {
                hospital_id: req.hospital.hospital_id,
                eth_address: eth_address
            }
        });

    } catch (error) {
        console.error('[HOSPITAL] Update ETH address error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update Ethereum address'
        });
    }
});

module.exports = router;
