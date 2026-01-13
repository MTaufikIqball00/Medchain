import { Block, MedicalRecordData } from '../types';

// Simulate SHA-256 Hashing using Web Crypto API
export const calculateHash = async (
  index: number,
  previousHash: string,
  timestamp: number,
  data: MedicalRecordData,
  nonce: number
): Promise<string> => {
  const msg = `${index}${previousHash}${timestamp}${JSON.stringify(data)}${nonce}`;
  const msgBuffer = new TextEncoder().encode(msg);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Create the Genesis Block (The first block in the chain)
export const createGenesisBlock = async (): Promise<Block> => {
  const timestamp = Date.now();
  const data: MedicalRecordData = {
    patientId: "GENESIS",
    patientName: "System Root",
    department: "System",
    symptoms: "N/A",
    diagnosis: "System Initialization",
    treatment: "N/A",
    doctorName: "Admin",
    notes: "Genesis Block - Ledger Started",
    timestamp: timestamp
  };
  
  const hash = await calculateHash(0, "0", timestamp, data, 0);

  return {
    index: 0,
    timestamp,
    data,
    previousHash: "0",
    hash,
    nonce: 0
  };
};

// Create a new block
export const createNewBlock = async (
  previousBlock: Block,
  data: MedicalRecordData
): Promise<Block> => {
  const index = previousBlock.index + 1;
  const timestamp = Date.now();
  const previousHash = previousBlock.hash;
  let nonce = 0;
  let hash = await calculateHash(index, previousHash, timestamp, data, nonce);

  // Simple Proof of Work simulation (finding a hash starting with '0')
  // In a real app, this difficulty would be much higher
  while (hash.substring(0, 1) !== '0') {
    nonce++;
    hash = await calculateHash(index, previousHash, timestamp, data, nonce);
  }

  return {
    index,
    timestamp,
    data,
    previousHash,
    hash,
    nonce
  };
};

export const verifyChain = async (chain: Block[]): Promise<boolean> => {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    if (currentBlock.previousHash !== previousBlock.hash) {
      return false;
    }

    const recalculatedHash = await calculateHash(
      currentBlock.index,
      currentBlock.previousHash,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.nonce
    );

    if (currentBlock.hash !== recalculatedHash) {
      return false;
    }
  }
  return true;
};