const crypto = require('crypto');
const { getEncryptionKey, getUidSalt } = require('./keyManager');

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts text using AES-256-CBC.
 * Now async to support key retrieval from KMS.
 */
async function encrypt(text) {
  const keyHex = await getEncryptionKey();
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyHex, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts text using AES-256-CBC.
 * Now async to support key retrieval from KMS.
 */
async function decrypt(text) {
  const keyHex = await getEncryptionKey();
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(keyHex, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function hashData(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Pseudonymization: Generate consistent PatientUID from NIK (National ID)
// Now async to support salt retrieval from secure storage
async function generatePatientUID(nik) {
    const salt = await getUidSalt();
    return crypto.createHash('sha256').update(nik + salt).digest('hex').substring(0, 16).toUpperCase();
}

module.exports = { encrypt, decrypt, hashData, generatePatientUID };
