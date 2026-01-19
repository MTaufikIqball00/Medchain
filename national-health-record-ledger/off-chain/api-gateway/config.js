require('dotenv').config();

module.exports = {
    BLOCKCHAIN_MODE: process.env.BLOCKCHAIN_MODE || 'MOCK', // 'MOCK' or 'REAL'
    ETH: {
        RPC_URL: process.env.ETH_RPC_URL,
        CONTRACT_ADDRESS: process.env.ETH_CONTRACT_ADDRESS,
        PRIVATE_KEY: process.env.ETH_PRIVATE_KEY
    },
    FABRIC: {
        // Allow overriding the connection profile path via env var
        CONNECTION_PROFILE_PATH: process.env.FABRIC_CONNECTION_PROFILE_PATH || './connection-profile.json',
        CHANNEL_NAME: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
        CHAINCODE_NAME: process.env.FABRIC_CHAINCODE_NAME || 'medchain',
        WALLET_PATH: process.env.FABRIC_WALLET_PATH || './wallet',
        USER_ID: process.env.FABRIC_USER_ID || 'appUser'
    }
};
