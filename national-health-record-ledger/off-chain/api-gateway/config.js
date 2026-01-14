require('dotenv').config();

module.exports = {
    BLOCKCHAIN_MODE: process.env.BLOCKCHAIN_MODE || 'MOCK', // 'MOCK' or 'REAL'
    ETH: {
        RPC_URL: process.env.ETH_RPC_URL,
        CONTRACT_ADDRESS: process.env.ETH_CONTRACT_ADDRESS,
        PRIVATE_KEY: process.env.ETH_PRIVATE_KEY
    },
    FABRIC: {
        CONNECTION_PROFILE: './connection-profile.json',
        CHANNEL_NAME: 'mychannel',
        CHAINCODE_NAME: 'medchain'
    }
};
