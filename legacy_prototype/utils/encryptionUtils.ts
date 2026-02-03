// Simulation of a Symmetric Key for the Medical Consortium
// In a real production app, this would be derived from the user's wallet private key or session
const SECRET_PASSPHRASE = "MEDCHAIN_CONSORTIUM_SECURE_KEY_2024";

const getCryptoKey = async (): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_PASSPHRASE),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("MEDCHAIN_SALT"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypts text and returns base64 string containing IV and Ciphertext
export const encryptText = async (text: string): Promise<string> => {
  if (!text) return "";
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );

  const encryptedArray = new Uint8Array(encrypted);
  
  // Combine IV and Ciphertext for storage
  // Format: iv_hex:ciphertext_base64
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherBase64 = btoa(String.fromCharCode(...encryptedArray));
  
  return `${ivHex}:${cipherBase64}`;
};

// Decrypts the proprietary format
export const decryptText = async (encryptedPackage: string): Promise<string> => {
  if (!encryptedPackage || !encryptedPackage.includes(':')) return encryptedPackage;
  
  try {
    const [ivHex, cipherBase64] = encryptedPackage.split(':');
    
    // Convert back to buffers
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const cipherString = atob(cipherBase64);
    const cipherArray = new Uint8Array(cipherString.length);
    for (let i = 0; i < cipherString.length; i++) {
        cipherArray[i] = cipherString.charCodeAt(i);
    }

    const key = await getCryptoKey();
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        cipherArray
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return "[Encrypted Data - Access Denied]";
  }
};