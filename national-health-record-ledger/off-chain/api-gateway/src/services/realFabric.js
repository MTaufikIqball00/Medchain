const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function submitTransaction(funcName, ...args) {
    try {
        // Load connection profile
        const ccpPath = path.resolve(__dirname, '..', '..', 'connection-profile.yaml');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8')); // Assuming JSON or YAML handled by loader, but fabric-network usually takes JSON object or path.
        // Note: fabric-network typically expects a JSON object or file path. If YAML, we need 'js-yaml'.
        // For simplicity, we will assume the profile is JSON or handled.
        // Let's force JSON usage for the profile in the setup step to be safe.

        // Setup Wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if user exists
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Connect to Gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get Network & Contract
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('medchain');

        // Submit Transaction
        console.log(`[FABRIC] Submitting ${funcName}...`);
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
