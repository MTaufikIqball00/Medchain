const crypto = require('crypto');

/**
 * Derives a strictly 32-byte buffer key from ENCRYPTION_KEY.
 * Accepts 64-char hex strings or any arbitrary passphrase (derived via SHA-256).
 */
function getKeyBuffer() {
    const key = process.env.ENCRYPTION_KEY || 'default_secure_medchain_secret_key_32_bytes_long';
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
}

const GCM_IV_LENGTH = 12; // Recommended standard for AES-GCM
const CBC_IV_LENGTH = 16; // Legacy fallback

/**
 * Encrypts plaintext using AES-256-GCM (Authenticated Encryption with Associated Data).
 * Returns format: iv_hex:auth_tag_hex:ciphertext_hex
 */
function encrypt(text) {
    if (!text) return '';
    const key = getKeyBuffer();
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text. Supports both modern AES-256-GCM (3 parts) and legacy AES-256-CBC (2 parts).
 */
function decrypt(text) {
    if (!text || typeof text !== 'string') return '';
    const key = getKeyBuffer();
    const parts = text.split(':');

    // Modern AES-256-GCM: iv:authTag:ciphertext
    if (parts.length === 3) {
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Legacy AES-256-CBC fallback: iv:ciphertext
    if (parts.length === 2) {
        const [ivHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    throw new Error('Invalid encrypted payload format');
}

/**
 * Generates SHA-256 hex hash of any object or string
 */
function hashData(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Pseudonymization: Generates a high-entropy PatientUID from NIK using HMAC-SHA256.
 * Resistant to rainbow tables and collision attacks.
 */
function generatePatientUID(nik) {
    const salt = process.env.UID_SALT || "MEDCHAIN_NATIONAL_PEPPER_SALT_2026";
    const hmac = crypto.createHmac('sha256', salt).update(String(nik).trim()).digest('hex');
    return `PAT-${hmac.substring(0, 24).toUpperCase()}`;
}

module.exports = { encrypt, decrypt, hashData, generatePatientUID };
