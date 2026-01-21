const crypto = require('crypto');

/**
 * KeyManager Service
 * Abstract secret retrieval to allow future integration with KMS (AWS KMS, HashiCorp Vault, etc.)
 * Currently wraps environment variables but returns Promises to enforce async patterns.
 */

// In-memory cache for keys to avoid frequent async calls if using a remote KMS
let cachedKey = null;
let cachedSalt = null;

async function getEncryptionKey() {
    if (cachedKey) return cachedKey;

    // Simulate async fetch from KMS
    // In production, this would be: await kmsClient.getParameter({ Name: 'ENCRYPTION_KEY', WithDecryption: true })
    return new Promise((resolve, reject) => {
        // Fallback to env var or generate random for dev/demo if not set
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
             console.warn("WARNING: ENCRYPTION_KEY not found in env, using random key. DATA WILL BE LOST ON RESTART.");
             // For safety in this demo environment, we return a random key if none exists,
             // but in real prod we should probably throw an error.
             const randomKey = crypto.randomBytes(32).toString('hex');
             cachedKey = randomKey;
             resolve(randomKey);
        } else {
             // Validate key length (AES-256 requires 32 bytes = 64 hex chars)
             if (key.length !== 64) {
                 // Try to hash it to ensure 32 bytes if it's a passphrase
                 console.warn("WARNING: ENCRYPTION_KEY is not 32 bytes (64 hex chars). Hashing it to fit.");
                 cachedKey = crypto.createHash('sha256').update(key).digest('hex');
             } else {
                 cachedKey = key;
             }
             resolve(cachedKey);
        }
    });
}

async function getUidSalt() {
    if (cachedSalt) return cachedSalt;

    return new Promise((resolve) => {
        const salt = process.env.UID_SALT || "NATIONAL_SECRET_DEFAULT";
        cachedSalt = salt;
        resolve(salt);
    });
}

module.exports = {
    getEncryptionKey,
    getUidSalt
};
