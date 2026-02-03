const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract ABI - must match MedicalAnchor.sol
const CONTRACT_ABI = [
    // Hospital Registration
    "function registerHospital(address _hospitalAddress, string memory _hospitalId, string memory _name) public",
    "function isHospitalRegistered(address _address) public view returns (bool)",
    "function getHospitalInfo(address _hospital) public view returns (string memory hospitalId, string memory name, bool isRegistered, uint256 registeredAt)",

    // Trust Anchor Functions
    "function anchorHash(string memory _fabricTxId, string memory _hashString) public",
    "function verifyIntegrity(string memory _fabricTxId, string memory _candidateHashString) public view returns (bool)",
    "function getProof(string memory _fabricTxId) public view returns (bytes32 dataHash, uint256 timestamp, address hospitalNode, bool exists)",

    // Access Control Functions
    "function requestAccess(string memory _recordId, address _ownerHospital) public",
    "function grantAccess(string memory _recordId, address _requesterHospital) public",
    "function revokeAccess(string memory _recordId, address _hospitalToRevoke) public",
    "function hasAccess(string memory _recordId, address _hospital) public view returns (bool)",
    "function getAccessRequest(string memory _recordId, address _requester) public view returns (address requester, address owner, uint256 requestedAt, bool approved, bool pending)",

    // Events
    "event HospitalRegistered(address indexed hospitalAddress, string hospitalId, string name, uint256 timestamp)",
    "event ProofAnchored(string indexed fabricTxId, bytes32 indexed dataHash, address indexed hospital, uint256 timestamp)",
    "event AccessRequested(string indexed recordId, address indexed requester, address indexed owner, uint256 timestamp)",
    "event AccessGranted(string indexed recordId, address indexed owner, address indexed grantedTo, uint256 timestamp)",
    "event AccessRevoked(string indexed recordId, address indexed owner, address indexed revokedFrom, uint256 timestamp)"
];

let provider;
let adminWallet;
let contract;
let hospitalWallets = {};

/**
 * Initialize Ethereum connection
 */
async function init() {
    if (contract) return;

    const rpcUrl = process.env.ETH_RPC_URL || 'http://localhost:8545';
    const adminPrivateKey = process.env.ETH_ADMIN_PRIVATE_KEY;
    const contractAddress = process.env.ETH_CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.warn('[ETHEREUM] ⚠️ ETH_CONTRACT_ADDRESS not set - Ethereum features disabled');
        return;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);

    if (adminPrivateKey) {
        adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    }

    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

    console.log(`[ETHEREUM] ✅ Connected to ${rpcUrl}`);
    console.log(`[ETHEREUM] Contract: ${contractAddress}`);
}

/**
 * Get wallet for a hospital (by private key stored in env)
 */
function getHospitalWallet(hospitalId) {
    const privateKey = process.env[`ETH_PRIVATE_KEY_${hospitalId.toUpperCase().replace(/-/g, '_')}`];
    if (!privateKey) {
        throw new Error(`No Ethereum private key configured for hospital: ${hospitalId}`);
    }

    if (!hospitalWallets[hospitalId]) {
        hospitalWallets[hospitalId] = new ethers.Wallet(privateKey, provider);
    }

    return hospitalWallets[hospitalId];
}

/**
 * Anchor a data hash to Ethereum (Trust Anchor)
 */
async function anchorHash(fabricTxId, dataHash, hospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[ETHEREUM] Anchoring hash for: ${fabricTxId}`);

    try {
        const wallet = getHospitalWallet(hospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.anchorHash(fabricTxId, dataHash);
        console.log(`[ETHEREUM] Tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[ETHEREUM] ✅ Anchored in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[ETHEREUM] ❌ anchorHash error: ${error.message}`);
        throw error;
    }
}

/**
 * Verify data integrity
 */
async function verifyIntegrity(fabricTxId, candidateHash) {
    await init();
    if (!contract) return null;

    try {
        const isValid = await contract.verifyIntegrity(fabricTxId, candidateHash);
        return isValid;
    } catch (error) {
        console.error(`[ETHEREUM] verifyIntegrity error: ${error.message}`);
        return false;
    }
}

/**
 * Get proof details
 */
async function getProof(fabricTxId) {
    await init();
    if (!contract) return null;

    try {
        const proof = await contract.getProof(fabricTxId);
        return {
            dataHash: proof.dataHash,
            timestamp: Number(proof.timestamp),
            hospitalNode: proof.hospitalNode,
            exists: proof.exists
        };
    } catch (error) {
        console.error(`[ETHEREUM] getProof error: ${error.message}`);
        return null;
    }
}

/**
 * Request access to a record (Access Control)
 */
async function requestAccess(recordId, ownerAddress, requesterHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[ETHEREUM] Requesting access: ${requesterHospitalId} -> record ${recordId}`);

    try {
        const wallet = getHospitalWallet(requesterHospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.requestAccess(recordId, ownerAddress);
        console.log(`[ETHEREUM] Request tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[ETHEREUM] ✅ Access request recorded in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[ETHEREUM] ❌ requestAccess error: ${error.message}`);
        throw error;
    }
}

/**
 * Grant access to a requesting hospital (Access Control)
 */
async function grantAccess(recordId, requesterAddress, ownerHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[ETHEREUM] Granting access: ${ownerHospitalId} granting access to ${requesterAddress}`);

    try {
        const wallet = getHospitalWallet(ownerHospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.grantAccess(recordId, requesterAddress);
        console.log(`[ETHEREUM] Grant tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[ETHEREUM] ✅ Access granted in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[ETHEREUM] ❌ grantAccess error: ${error.message}`);
        throw error;
    }
}

/**
 * Revoke access from a hospital (Access Control)
 */
async function revokeAccess(recordId, hospitalToRevoke, ownerHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[ETHEREUM] Revoking access from ${hospitalToRevoke} for record ${recordId}`);

    try {
        const wallet = getHospitalWallet(ownerHospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.revokeAccess(recordId, hospitalToRevoke);
        console.log(`[ETHEREUM] Revoke tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[ETHEREUM] ✅ Access revoked in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[ETHEREUM] ❌ revokeAccess error: ${error.message}`);
        throw error;
    }
}

/**
 * Check if hospital has access (read-only)
 */
async function hasAccess(recordId, hospitalAddress) {
    await init();
    if (!contract) return false;

    try {
        return await contract.hasAccess(recordId, hospitalAddress);
    } catch (error) {
        console.error(`[ETHEREUM] hasAccess error: ${error.message}`);
        return false;
    }
}

/**
 * Check if hospital is registered
 */
async function isHospitalRegistered(hospitalAddress) {
    await init();
    if (!contract) return false;

    try {
        return await contract.isHospitalRegistered(hospitalAddress);
    } catch (error) {
        console.error(`[ETHEREUM] isHospitalRegistered error: ${error.message}`);
        return false;
    }
}

/**
 * Register a hospital (admin only)
 */
async function registerHospital(hospitalAddress, hospitalId, name) {
    await init();
    if (!contract || !adminWallet) {
        throw new Error('Contract or admin wallet not initialized');
    }

    console.log(`[ETHEREUM] Registering hospital: ${hospitalId}`);

    try {
        const contractWithSigner = contract.connect(adminWallet);

        const tx = await contractWithSigner.registerHospital(hospitalAddress, hospitalId, name);
        console.log(`[ETHEREUM] Register tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[ETHEREUM] ✅ Hospital registered in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[ETHEREUM] ❌ registerHospital error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    init,
    anchorHash,
    verifyIntegrity,
    getProof,
    requestAccess,
    grantAccess,
    revokeAccess,
    hasAccess,
    isHospitalRegistered,
    registerHospital
};
