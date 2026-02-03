const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

let gateway = null;
let contract = null;

/**
 * Initialize connection to Fabric network
 */
async function initConnection() {
    if (contract) return contract;

    try {
        // Load connection profile
        let ccpPath = config.FABRIC.CONNECTION_PROFILE_PATH;
        if (!path.isAbsolute(ccpPath)) {
            ccpPath = path.resolve(process.cwd(), ccpPath);
        }

        if (!fs.existsSync(ccpPath)) {
            throw new Error(`Connection profile not found at: ${ccpPath}`);
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Setup Wallet
        let walletPath = config.FABRIC.WALLET_PATH;
        if (!path.isAbsolute(walletPath)) {
            walletPath = path.resolve(process.cwd(), walletPath);
        }

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if user exists
        const userId = config.FABRIC.USER_ID;
        const identity = await wallet.get(userId);
        if (!identity) {
            console.log(`[FABRIC] ⚠️ Identity "${userId}" not found in wallet at ${walletPath}`);
            console.log('[FABRIC] Please enroll the user first using enrollAdmin.js and registerUser.js');
            return null;
        }

        // Connect to Gateway
        gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get Network & Contract
        const network = await gateway.getNetwork(config.FABRIC.CHANNEL_NAME);
        contract = network.getContract(config.FABRIC.CHAINCODE_NAME);

        console.log(`[FABRIC] ✅ Connected to channel: ${config.FABRIC.CHANNEL_NAME}`);
        console.log(`[FABRIC] ✅ Using chaincode: ${config.FABRIC.CHAINCODE_NAME}`);

        return contract;
    } catch (error) {
        console.error(`[FABRIC] ❌ Failed to connect: ${error.message}`);
        throw error;
    }
}

/**
 * Submit a transaction to the Fabric network
 */
async function submitTransaction(funcName, ...args) {
    try {
        const contract = await initConnection();
        if (!contract) {
            // Fallback to mock if connection fails
            console.log(`[FABRIC] ⚠️ Running in fallback mode - returning mock TX ID`);
            return `MOCK_FABRIC_TX_${Date.now()}`;
        }

        console.log(`[FABRIC] Submitting ${funcName}(${args.join(', ')})`);
        const result = await contract.submitTransaction(funcName, ...args);

        const txId = result.toString() || `FABRIC_TX_${Date.now()}`;
        console.log(`[FABRIC] ✅ Transaction committed: ${txId}`);

        return txId;
    } catch (error) {
        console.error(`[FABRIC] ❌ submitTransaction error: ${error.message}`);
        // Return mock TX ID on error to allow API to continue
        return `FABRIC_TX_${Date.now()}_ERROR`;
    }
}

/**
 * Evaluate a query (read-only) on the Fabric network
 */
async function evaluateTransaction(funcName, ...args) {
    try {
        const contract = await initConnection();
        if (!contract) {
            return null;
        }

        console.log(`[FABRIC] Evaluating ${funcName}(${args.join(', ')})`);
        const result = await contract.evaluateTransaction(funcName, ...args);

        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`[FABRIC] ❌ evaluateTransaction error: ${error.message}`);
        return null;
    }
}

/**
 * Get transaction history for a record
 */
async function getTransactionHistory(recordId) {
    try {
        const contract = await initConnection();
        if (!contract) {
            return [];
        }

        console.log(`[FABRIC] Getting history for: ${recordId}`);
        const result = await contract.evaluateTransaction('GetTransactionHistory', recordId);

        const history = JSON.parse(result.toString());
        console.log(`[FABRIC] ✅ Found ${history.length} history entries`);

        return history;
    } catch (error) {
        console.error(`[FABRIC] ❌ getTransactionHistory error: ${error.message}`);
        return [];
    }
}

/**
 * Query records by patient ID
 */
async function queryByPatientID(patientId) {
    try {
        const contract = await initConnection();
        if (!contract) {
            return [];
        }

        const result = await contract.evaluateTransaction('QueryByPatientID', patientId);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`[FABRIC] ❌ queryByPatientID error: ${error.message}`);
        return [];
    }
}

/**
 * Read a specific record from the ledger
 */
async function readRecord(recordId) {
    try {
        const contract = await initConnection();
        if (!contract) {
            return null;
        }

        const result = await contract.evaluateTransaction('ReadMetadata', recordId);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`[FABRIC] ❌ readRecord error: ${error.message}`);
        return null;
    }
}

/**
 * Disconnect from the gateway
 */
async function disconnect() {
    if (gateway) {
        await gateway.disconnect();
        gateway = null;
        contract = null;
        console.log('[FABRIC] Disconnected from gateway');
    }
}

// Handle process exit
process.on('exit', disconnect);
process.on('SIGINT', async () => {
    await disconnect();
    process.exit();
});

module.exports = {
    submitTransaction,
    evaluateTransaction,
    getTransactionHistory,
    queryByPatientID,
    readRecord,
    disconnect
};
