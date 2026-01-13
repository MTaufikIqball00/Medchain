module.exports = {
    submitTransaction: async (func, ...args) => {
        console.log(`[HYPERLEDGER FABRIC] Invoking Chaincode: ${func}`);
        console.log(`   > Args: ${args.join(', ')}`);
        return "FABRIC_TX_ID_" + Date.now();
    }
};
