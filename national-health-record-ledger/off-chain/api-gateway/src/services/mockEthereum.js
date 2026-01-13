module.exports = {
    anchorHash: async (recordId, hash, sender) => {
        console.log(`[ETHEREUM] Sending Transaction to MedicalAnchor Contract`);
        console.log(`   > RecordID (Meta): ${recordId}`);
        console.log(`   > DataHash: ${hash}`);
        return "0xETH_TX_HASH_" + Math.random().toString(16).substr(2, 40);
    }
};
