const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

async function submitTransaction(funcName, ...args) {
    try {
        // Load connection profile from Config
        // If the path is absolute, use it directly. If relative, resolve from current working dir or config dir.
        // Best practice: Assume user provides absolute path or path relative to api-gateway root.
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
            console.log(`An identity for the user "${userId}" does not exist in the wallet at ${walletPath}`);
            console.log('Ensure you have enrolled the user and imported the identity into the wallet.');
            return;
        }

        // Connect to Gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true } // asLocalhost: true implies Docker on localhost
        });

        // Get Network & Contract
        const network = await gateway.getNetwork(config.FABRIC.CHANNEL_NAME);
        const contract = network.getContract(config.FABRIC.CHAINCODE_NAME);

        // Submit Transaction
        console.log(`[FABRIC] Submitting ${funcName} to channel ${config.FABRIC.CHANNEL_NAME}...`);
        const result = await contract.submitTransaction(funcName, ...args);
        console.log(`[FABRIC] Transaction committed.`);

        await gateway.disconnect();

        return result.toString();

    } catch (error) {
        console.error(`[FABRIC] Failed to submit transaction: ${error}`);
        throw error;
    }
}

module.exports = { submitTransaction };
