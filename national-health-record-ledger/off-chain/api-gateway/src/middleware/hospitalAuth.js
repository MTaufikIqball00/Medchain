const jwt = require('jsonwebtoken');
const { hospitalDB } = require('../services/database');

const JWT_SECRET = process.env.JWT_SECRET || 'medicalchain-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token for hospital
 */
function generateToken(hospital) {
    return jwt.sign(
        {
            hospital_id: hospital.hospital_id,
            name: hospital.name,
            eth_address: hospital.eth_address
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware: Authenticate hospital from JWT token
 */
async function authenticateHospital(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token provided',
                hint: 'Include header: Authorization: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                hint: 'Please login again to get a new token'
            });
        }

        // Verify hospital still exists and is active
        const hospital = await hospitalDB.findById(decoded.hospital_id);
        if (!hospital) {
            return res.status(401).json({
                success: false,
                error: 'Hospital not found or inactive'
            });
        }

        // Attach hospital info to request
        req.hospital = {
            hospital_id: hospital.hospital_id,
            name: hospital.name,
            eth_address: hospital.eth_address
        };

        next();
    } catch (error) {
        console.error('[AUTH] Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Middleware: Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);

            if (decoded) {
                const hospital = await hospitalDB.findById(decoded.hospital_id);
                if (hospital) {
                    req.hospital = {
                        hospital_id: hospital.hospital_id,
                        name: hospital.name,
                        eth_address: hospital.eth_address
                    };
                }
            }
        }

        next();
    } catch (error) {
        next();
    }
}

/**
 * Middleware: Check if hospital is record owner
 */
function requireRecordOwnership(getRecordFn) {
    return async (req, res, next) => {
        try {
            const record = await getRecordFn(req);

            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'Record not found'
                });
            }

            if (record.hospital_id !== req.hospital.hospital_id) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. You are not the record owner.',
                    owner: record.hospital_id,
                    requester: req.hospital.hospital_id
                });
            }

            req.record = record;
            next();
        } catch (error) {
            console.error('[AUTH] Ownership check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify record ownership'
            });
        }
    };
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateHospital,
    optionalAuth,
    requireRecordOwnership,
    JWT_SECRET
};
