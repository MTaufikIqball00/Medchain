const { ethers } = require('ethers');

/**
 * MedicalDataRequest Contract ABI
 * Must match MedicalDataRequest.sol
 */
const CONTRACT_ABI = [
    // Hospital Registration
    "function registerHospital(address _hospitalAddress, string memory _hospitalId, string memory _name) public",
    "function isHospitalRegistered(address _address) public view returns (bool)",
    "function getHospitalInfo(address _hospital) public view returns (string memory hospitalId, string memory name, bool isRegistered, uint256 registeredAt)",
    "function getHospitalCount() public view returns (uint256)",

    // Data Request Functions
    "function requestPatientData(string memory _requestId, address _targetHospital, bytes32 _patientUID, string memory _purpose) public",
    "function approveRequest(string memory _requestId) public",
    "function rejectRequest(string memory _requestId) public",
    "function anchorDataHash(string memory _requestId, bytes32 _dataHash) public",

    // View Functions
    "function getRequestStatus(string memory _requestId) public view returns (uint8)",
    "function isAccessActive(string memory _requestId) public view returns (bool)",
    "function getRequest(string memory _requestId) public view returns (address requestingHospital, address targetHospital, bytes32 patientUID, bytes32 dataHash, uint256 timestamp, uint256 approvedAt, uint256 expiresAt, uint8 status, string memory purpose)",
    "function getPendingRequestsCount(address _hospital) public view returns (uint256)",
    "function getPendingRequestIds(address _hospital) public view returns (string[] memory)",
    "function getTotalRequestCount() public view returns (uint256)",
    "function getRemainingRateLimit(address _hospital) public view returns (uint256)",

    // Events
    "event HospitalRegistered(address indexed hospitalAddress, string hospitalId, string name, uint256 timestamp)",
    "event DataRequestCreated(string indexed requestId, address indexed requestingHospital, address indexed targetHospital, bytes32 patientUID, string purpose, uint256 timestamp)",
    "event RequestApproved(string indexed requestId, address indexed targetHospital, address indexed requestingHospital, uint256 approvedAt, uint256 expiresAt)",
    "event RequestRejected(string indexed requestId, address indexed targetHospital, address indexed requestingHospital, uint256 timestamp)",
    "event DataHashAnchored(string indexed requestId, bytes32 indexed dataHash, address indexed targetHospital, uint256 timestamp)"
];

// Request status enum mapping
const RequestStatusMap = {
    0: 'PENDING',
    1: 'APPROVED',
    2: 'REJECTED',
    3: 'EXPIRED'
};

let provider = null;
let contract = null;
let hospitalWallets = {};
let isInitialized = false;

/**
 * Initialize Ethereum connection for MedicalDataRequest contract
 */
async function init() {
    if (isInitialized) return;

    const rpcUrl = process.env.ETH_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.DATA_REQUEST_CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.warn('[DATA-REQUEST-ETH] ⚠️ DATA_REQUEST_CONTRACT_ADDRESS not set - features disabled');
        return;
    }

    try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

        // Test connection
        await provider.getBlockNumber();

        console.log(`[DATA-REQUEST-ETH] ✅ Connected to ${rpcUrl}`);
        console.log(`[DATA-REQUEST-ETH] Contract: ${contractAddress}`);

        isInitialized = true;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ Connection failed: ${error.message}`);
        throw error;
    }
}

/**
 * Get wallet for a hospital by ID (reads private key from env)
 */
function getHospitalWallet(hospitalId) {
    const envKey = `ETH_PRIVATE_KEY_${hospitalId.toUpperCase().replace(/-/g, '_')}`;
    const privateKey = process.env[envKey];

    if (!privateKey) {
        throw new Error(`No Ethereum private key configured for hospital: ${hospitalId} (expected env var: ${envKey})`);
    }

    if (!hospitalWallets[hospitalId]) {
        hospitalWallets[hospitalId] = new ethers.Wallet(privateKey, provider);
    }

    return hospitalWallets[hospitalId];
}

/**
 * Create a new data request on blockchain
 * @param {string} requestId - Unique request identifier
 * @param {string} targetHospitalAddress - Ethereum address of target hospital
 * @param {string} patientUIDHash - SHA-256 hash of patient UID
 * @param {string} purpose - Purpose of the request
 * @param {string} requesterHospitalId - Hospital ID of the requester
 * @returns {string} Transaction hash
 */
async function createDataRequest(requestId, targetHospitalAddress, patientUIDHash, purpose, requesterHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[DATA-REQUEST-ETH] Creating request: ${requestId}`);

    try {
        const wallet = getHospitalWallet(requesterHospitalId);
        const contractWithSigner = contract.connect(wallet);

        // Convert hash string to bytes32
        const patientUIDBytes32 = ethers.zeroPadValue(ethers.toBeHex(ethers.keccak256(ethers.toUtf8Bytes(patientUIDHash))), 32);

        const tx = await contractWithSigner.requestPatientData(
            requestId,
            targetHospitalAddress,
            patientUIDBytes32,
            purpose
        );
        console.log(`[DATA-REQUEST-ETH] TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[DATA-REQUEST-ETH] ✅ Request recorded in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ createDataRequest error: ${error.message}`);
        throw error;
    }
}

/**
 * Approve a data request
 * @param {string} requestId - Request ID to approve
 * @param {string} approverHospitalId - Hospital ID of the approver (target hospital)
 * @returns {string} Transaction hash
 */
async function approveDataRequest(requestId, approverHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[DATA-REQUEST-ETH] Approving request: ${requestId}`);

    try {
        const wallet = getHospitalWallet(approverHospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.approveRequest(requestId);
        console.log(`[DATA-REQUEST-ETH] TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[DATA-REQUEST-ETH] ✅ Request approved in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ approveDataRequest error: ${error.message}`);
        throw error;
    }
}

/**
 * Reject a data request
 * @param {string} requestId - Request ID to reject
 * @param {string} rejecterHospitalId - Hospital ID of the rejecter (target hospital)
 * @returns {string} Transaction hash
 */
async function rejectDataRequest(requestId, rejecterHospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[DATA-REQUEST-ETH] Rejecting request: ${requestId}`);

    try {
        const wallet = getHospitalWallet(rejecterHospitalId);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.rejectRequest(requestId);
        console.log(`[DATA-REQUEST-ETH] TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[DATA-REQUEST-ETH] ✅ Request rejected in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ rejectDataRequest error: ${error.message}`);
        throw error;
    }
}

/**
 * Anchor data hash to blockchain after approval
 * @param {string} requestId - Request ID
 * @param {string} dataHash - SHA-256 hash of the medical data
 * @param {string} hospitalId - Hospital ID of the data owner
 * @returns {string} Transaction hash
 */
async function anchorDataHash(requestId, dataHash, hospitalId) {
    await init();
    if (!contract) return null;

    console.log(`[DATA-REQUEST-ETH] Anchoring hash for request: ${requestId}`);

    try {
        const wallet = getHospitalWallet(hospitalId);
        const contractWithSigner = contract.connect(wallet);

        // Convert hash string to bytes32
        const dataHashBytes32 = ethers.zeroPadValue(ethers.toBeHex(ethers.keccak256(ethers.toUtf8Bytes(dataHash))), 32);

        const tx = await contractWithSigner.anchorDataHash(requestId, dataHashBytes32);
        console.log(`[DATA-REQUEST-ETH] TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[DATA-REQUEST-ETH] ✅ Hash anchored in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ anchorDataHash error: ${error.message}`);
        throw error;
    }
}

/**
 * Get request status from blockchain
 * @param {string} requestId - Request ID
 * @returns {object} Status info
 */
async function getDataRequestStatus(requestId) {
    await init();
    if (!contract) return null;

    try {
        const statusCode = await contract.getRequestStatus(requestId);
        const isActive = await contract.isAccessActive(requestId);

        return {
            status: RequestStatusMap[Number(statusCode)] || 'UNKNOWN',
            statusCode: Number(statusCode),
            isAccessActive: isActive
        };
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] getDataRequestStatus error: ${error.message}`);
        return null;
    }
}

/**
 * Get full request details from blockchain
 * @param {string} requestId - Request ID
 * @returns {object} Request details
 */
async function getRequestDetails(requestId) {
    await init();
    if (!contract) return null;

    try {
        const result = await contract.getRequest(requestId);

        return {
            requestingHospital: result[0],
            targetHospital: result[1],
            patientUID: result[2],
            dataHash: result[3],
            timestamp: Number(result[4]),
            approvedAt: Number(result[5]),
            expiresAt: Number(result[6]),
            status: RequestStatusMap[Number(result[7])] || 'UNKNOWN',
            purpose: result[8]
        };
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] getRequestDetails error: ${error.message}`);
        return null;
    }
}

/**
 * Check if access is currently active
 * @param {string} requestId - Request ID
 * @returns {boolean} Whether access is active
 */
async function isAccessActive(requestId) {
    await init();
    if (!contract) return false;

    try {
        return await contract.isAccessActive(requestId);
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] isAccessActive error: ${error.message}`);
        return false;
    }
}

/**
 * Get remaining rate limit for a hospital
 * @param {string} hospitalAddress - Ethereum address of hospital
 * @returns {number} Remaining requests allowed this hour
 */
async function getRemainingRateLimit(hospitalAddress) {
    await init();
    if (!contract) return 0;

    try {
        return Number(await contract.getRemainingRateLimit(hospitalAddress));
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] getRemainingRateLimit error: ${error.message}`);
        return 0;
    }
}

/**
 * Register a hospital on blockchain (admin only)
 * @param {string} hospitalAddress - Ethereum address
 * @param {string} hospitalId - Hospital ID
 * @param {string} name - Hospital name
 * @returns {string} Transaction hash
 */
async function registerHospital(hospitalAddress, hospitalId, name) {
    await init();
    if (!contract) return null;

    const adminPrivateKey = process.env.ETH_ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
        throw new Error('ETH_ADMIN_PRIVATE_KEY not configured');
    }

    try {
        const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
        const contractWithSigner = contract.connect(adminWallet);

        const tx = await contractWithSigner.registerHospital(hospitalAddress, hospitalId, name);
        console.log(`[DATA-REQUEST-ETH] Register TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[DATA-REQUEST-ETH] ✅ Hospital registered in block: ${receipt.blockNumber}`);

        return tx.hash;
    } catch (error) {
        console.error(`[DATA-REQUEST-ETH] ❌ registerHospital error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    init,
    createDataRequest,
    approveDataRequest,
    rejectDataRequest,
    anchorDataHash,
    getDataRequestStatus,
    getRequestDetails,
    isAccessActive,
    getRemainingRateLimit,
    registerHospital
};
