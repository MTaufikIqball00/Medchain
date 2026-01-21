require('dotenv').config();

module.exports = {
    BLOCKCHAIN_MODE: process.env.BLOCKCHAIN_MODE || 'MOCK', // 'MOCK' or 'REAL'
    FABRIC: {
        // Allow overriding the connection profile path via env var
        CONNECTION_PROFILE_PATH: process.env.FABRIC_CONNECTION_PROFILE_PATH || './connection-org1.json',
        CHANNEL_NAME: process.env.FABRIC_CHANNEL_NAME || 'medchannel',
        CHAINCODE_NAME: process.env.FABRIC_CHAINCODE_NAME || 'medrecords',
        WALLET_PATH: process.env.FABRIC_WALLET_PATH || './wallet',
        USER_ID: process.env.FABRIC_USER_ID || 'appUser'
    }
};
