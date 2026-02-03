const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'medicalchain',
    user: process.env.PG_USER || 'medchain',
    password: process.env.PG_PASSWORD || 'medchain123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Initialize database tables
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('[DB] Initializing database tables...');

        // Create hospitals table
        await client.query(`
            CREATE TABLE IF NOT EXISTS hospitals (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                eth_address VARCHAR(42) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create patients table (off-chain PII data)
        await client.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                patient_uid VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(200),
                nik VARCHAR(20),
                date_of_birth DATE,
                place_of_birth VARCHAR(100),
                blood_type VARCHAR(5),
                gender VARCHAR(10),
                address TEXT,
                phone VARCHAR(20),
                email VARCHAR(100),
                encrypted_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create medical_records table
        await client.query(`
            CREATE TABLE IF NOT EXISTS medical_records (
                id SERIAL PRIMARY KEY,
                record_id VARCHAR(100) UNIQUE NOT NULL,
                patient_uid VARCHAR(50) NOT NULL REFERENCES patients(patient_uid),
                hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id),
                fabric_tx_id VARCHAR(100),
                eth_tx_hash VARCHAR(66),
                diagnosis TEXT,
                treatment TEXT,
                symptoms TEXT,
                department VARCHAR(100),
                doctor_name VARCHAR(200),
                data_hash VARCHAR(64) NOT NULL,
                is_encrypted BOOLEAN DEFAULT true,
                is_deleted BOOLEAN DEFAULT false,
                version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create access_requests table
        await client.query(`
            CREATE TABLE IF NOT EXISTS access_requests (
                id SERIAL PRIMARY KEY,
                record_id VARCHAR(100) NOT NULL REFERENCES medical_records(record_id),
                requester_hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id),
                owner_hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id),
                eth_request_tx VARCHAR(66),
                eth_grant_tx VARCHAR(66),
                status VARCHAR(20) DEFAULT 'PENDING',
                reason TEXT,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP,
                UNIQUE(record_id, requester_hospital_id)
            )
        `);

        // Create access_permissions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS access_permissions (
                id SERIAL PRIMARY KEY,
                record_id VARCHAR(100) NOT NULL REFERENCES medical_records(record_id),
                hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id),
                granted_by VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id),
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(record_id, hospital_id)
            )
        `);

        // Create indexes for better query performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_uid);
            CREATE INDEX IF NOT EXISTS idx_records_hospital ON medical_records(hospital_id);
            CREATE INDEX IF NOT EXISTS idx_access_requester ON access_requests(requester_hospital_id);
            CREATE INDEX IF NOT EXISTS idx_access_status ON access_requests(status);
            CREATE INDEX IF NOT EXISTS idx_permissions_hospital ON access_permissions(hospital_id);
        `);

        console.log('[DB] ✅ Database tables initialized successfully');
    } catch (error) {
        console.error('[DB] ❌ Failed to initialize database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Hospital operations
const hospitalDB = {
    async create(hospitalData) {
        const { hospital_id, name, eth_address, password_hash } = hospitalData;
        const result = await pool.query(
            `INSERT INTO hospitals (hospital_id, name, eth_address, password_hash) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [hospital_id, name, eth_address, password_hash]
        );
        return result.rows[0];
    },

    async findById(hospital_id) {
        const result = await pool.query(
            'SELECT * FROM hospitals WHERE hospital_id = $1 AND is_active = true',
            [hospital_id]
        );
        return result.rows[0];
    },

    async findByEthAddress(eth_address) {
        const result = await pool.query(
            'SELECT * FROM hospitals WHERE eth_address = $1 AND is_active = true',
            [eth_address]
        );
        return result.rows[0];
    },

    async getAll() {
        const result = await pool.query(
            'SELECT hospital_id, name, eth_address, created_at FROM hospitals WHERE is_active = true'
        );
        return result.rows;
    }
};

// Patient operations
const patientDB = {
    async create(patientData) {
        const { patient_uid, full_name, nik, date_of_birth, place_of_birth, blood_type, gender, address, phone, email, encrypted_data } = patientData;
        const result = await pool.query(
            `INSERT INTO patients (patient_uid, full_name, nik, date_of_birth, place_of_birth, blood_type, gender, address, phone, email, encrypted_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [patient_uid, full_name, nik, date_of_birth, place_of_birth, blood_type, gender, address, phone, email, encrypted_data]
        );
        return result.rows[0];
    },

    async findByUid(patient_uid) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE patient_uid = $1',
            [patient_uid]
        );
        return result.rows[0];
    },

    async update(patient_uid, updates) {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

        const result = await pool.query(
            `UPDATE patients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE patient_uid = $1 RETURNING *`,
            [patient_uid, ...values]
        );
        return result.rows[0];
    }
};

// Medical Records operations
const recordDB = {
    async create(recordData) {
        const {
            record_id, patient_uid, hospital_id, fabric_tx_id, eth_tx_hash,
            diagnosis, treatment, symptoms, department, doctor_name, data_hash, is_encrypted
        } = recordData;

        const result = await pool.query(
            `INSERT INTO medical_records 
             (record_id, patient_uid, hospital_id, fabric_tx_id, eth_tx_hash, diagnosis, treatment, symptoms, department, doctor_name, data_hash, is_encrypted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [record_id, patient_uid, hospital_id, fabric_tx_id, eth_tx_hash, diagnosis, treatment, symptoms, department, doctor_name, data_hash, is_encrypted || false]
        );
        return result.rows[0];
    },

    async findById(record_id) {
        const result = await pool.query(
            'SELECT * FROM medical_records WHERE record_id = $1 AND is_deleted = false',
            [record_id]
        );
        return result.rows[0];
    },

    async findByPatient(patient_uid) {
        const result = await pool.query(
            'SELECT * FROM medical_records WHERE patient_uid = $1 AND is_deleted = false ORDER BY created_at DESC',
            [patient_uid]
        );
        return result.rows;
    },

    async findByHospital(hospital_id) {
        const result = await pool.query(
            'SELECT * FROM medical_records WHERE hospital_id = $1 AND is_deleted = false ORDER BY created_at DESC',
            [hospital_id]
        );
        return result.rows;
    },

    async update(record_id, updates) {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

        const result = await pool.query(
            `UPDATE medical_records SET ${setClause}, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE record_id = $1 RETURNING *`,
            [record_id, ...values]
        );
        return result.rows[0];
    },

    async softDelete(record_id) {
        const result = await pool.query(
            'UPDATE medical_records SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE record_id = $1 RETURNING *',
            [record_id]
        );
        return result.rows[0];
    },

    async getAll() {
        const result = await pool.query(
            'SELECT * FROM medical_records WHERE is_deleted = false ORDER BY created_at DESC'
        );
        return result.rows;
    }
};

// Access Request operations
const accessRequestDB = {
    async create(requestData) {
        const { record_id, requester_hospital_id, owner_hospital_id, eth_request_tx, reason } = requestData;
        const result = await pool.query(
            `INSERT INTO access_requests (record_id, requester_hospital_id, owner_hospital_id, eth_request_tx, reason)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [record_id, requester_hospital_id, owner_hospital_id, eth_request_tx, reason]
        );
        return result.rows[0];
    },

    async findByRecordAndRequester(record_id, requester_hospital_id) {
        const result = await pool.query(
            'SELECT * FROM access_requests WHERE record_id = $1 AND requester_hospital_id = $2',
            [record_id, requester_hospital_id]
        );
        return result.rows[0];
    },

    async getPendingForHospital(hospital_id) {
        const result = await pool.query(
            `SELECT ar.*, mr.patient_uid, p.full_name as patient_name, h.name as requester_name
             FROM access_requests ar
             JOIN medical_records mr ON ar.record_id = mr.record_id
             JOIN patients p ON mr.patient_uid = p.patient_uid
             JOIN hospitals h ON ar.requester_hospital_id = h.hospital_id
             WHERE ar.owner_hospital_id = $1 AND ar.status = 'PENDING'
             ORDER BY ar.requested_at DESC`,
            [hospital_id]
        );
        return result.rows;
    },

    async updateStatus(record_id, requester_hospital_id, status, eth_grant_tx = null) {
        const result = await pool.query(
            `UPDATE access_requests 
             SET status = $3, eth_grant_tx = $4, responded_at = CURRENT_TIMESTAMP 
             WHERE record_id = $1 AND requester_hospital_id = $2 RETURNING *`,
            [record_id, requester_hospital_id, status, eth_grant_tx]
        );
        return result.rows[0];
    }
};

// Access Permission operations
const accessPermissionDB = {
    async grant(permissionData) {
        const { record_id, hospital_id, granted_by } = permissionData;
        const result = await pool.query(
            `INSERT INTO access_permissions (record_id, hospital_id, granted_by)
             VALUES ($1, $2, $3) 
             ON CONFLICT (record_id, hospital_id) 
             DO UPDATE SET is_active = true, revoked_at = NULL, granted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [record_id, hospital_id, granted_by]
        );
        return result.rows[0];
    },

    async revoke(record_id, hospital_id) {
        const result = await pool.query(
            `UPDATE access_permissions 
             SET is_active = false, revoked_at = CURRENT_TIMESTAMP 
             WHERE record_id = $1 AND hospital_id = $2 RETURNING *`,
            [record_id, hospital_id]
        );
        return result.rows[0];
    },

    async hasAccess(record_id, hospital_id) {
        const result = await pool.query(
            `SELECT * FROM access_permissions 
             WHERE record_id = $1 AND hospital_id = $2 AND is_active = true`,
            [record_id, hospital_id]
        );
        return result.rows.length > 0;
    },

    async getAccessibleRecords(hospital_id) {
        const result = await pool.query(
            `SELECT mr.* FROM medical_records mr
             JOIN access_permissions ap ON mr.record_id = ap.record_id
             WHERE ap.hospital_id = $1 AND ap.is_active = true AND mr.is_deleted = false`,
            [hospital_id]
        );
        return result.rows;
    }
};

module.exports = {
    pool,
    initializeDatabase,
    hospitalDB,
    patientDB,
    recordDB,
    accessRequestDB,
    accessPermissionDB
};
