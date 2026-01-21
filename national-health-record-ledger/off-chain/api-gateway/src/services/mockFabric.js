// Mock World State
const chaincodeState = {};

module.exports = {
    submitTransaction: async (func, ...args) => {
        console.log(`[HYPERLEDGER FABRIC - MOCK] Invoking Chaincode: ${func}`);
        console.log(`   > Args: ${args.join(', ')}`);

        // Simulate Chaincode Logic
        try {
            if (func === 'CreateMetadata') {
                const [recordId, patientUid, hospitalId, location, dataHash, desc] = args;
                if (chaincodeState[recordId]) {
                    throw new Error(`The metadata ${recordId} already exists`);
                }
                chaincodeState[recordId] = {
                    recordId, patientUid, hospitalId, offChainLoc: location,
                    dataHash, description: desc,
                    timestamp: Math.floor(Date.now() / 1000),
                    isDeleted: false,
                    accessList: [hospitalId],
                    pendingRequests: []
                };
                return "MOCK_FABRIC_TX_" + Date.now();

            } else if (func === 'UpdateMetadata') {
                 const [recordId, dataHash, desc] = args;
                 if (!chaincodeState[recordId]) throw new Error("Record not found");
                 chaincodeState[recordId].dataHash = dataHash;
                 chaincodeState[recordId].description = desc;
                 return "MOCK_FABRIC_TX_" + Date.now();

            } else if (func === 'SoftDelete') {
                const [recordId] = args;
                if (!chaincodeState[recordId]) throw new Error("Record not found");
                chaincodeState[recordId].isDeleted = true;
                return "MOCK_FABRIC_TX_" + Date.now();

            } else if (func === 'RequestAccess') {
                const [recordId, requesterId] = args;
                if (!chaincodeState[recordId]) throw new Error("Record not found");
                const record = chaincodeState[recordId];

                if (record.accessList.includes(requesterId)) {
                    throw new Error(`Requester ${requesterId} already has access`);
                }
                if (!record.pendingRequests.includes(requesterId)) {
                    record.pendingRequests.push(requesterId);
                }
                return "MOCK_FABRIC_TX_" + Date.now();

            } else if (func === 'GrantAccess') {
                const [recordId, targetHospitalId] = args;
                if (!chaincodeState[recordId]) throw new Error("Record not found");
                const record = chaincodeState[recordId];

                if (!record.accessList.includes(targetHospitalId)) {
                    record.accessList.push(targetHospitalId);
                }
                // Remove from pending
                record.pendingRequests = record.pendingRequests.filter(id => id !== targetHospitalId);
                return "MOCK_FABRIC_TX_" + Date.now();
            }

            return "UNKNOWN_FUNC";

        } catch (err) {
            console.error(`[MOCK FABRIC ERROR] ${err.message}`);
            throw err;
        }
    },

    evaluateTransaction: async (func, ...args) => {
        console.log(`[HYPERLEDGER FABRIC - MOCK] Querying Chaincode: ${func}`);

        if (func === 'ReadMetadata') {
            const [recordId, requesterId] = args;
            const record = chaincodeState[recordId];

            if (!record) throw new Error(`The metadata ${recordId} does not exist`);
            if (record.isDeleted) throw new Error(`Record ${recordId} has been deleted`);

            // Access Control
            if (!record.accessList.includes(requesterId)) {
                throw new Error(`Access denied for requester: ${requesterId}`);
            }

            return Buffer.from(JSON.stringify(record));
        }

        // For simple existence check
        if (func === 'MetadataExists') {
             const [recordId] = args;
             return chaincodeState[recordId] ? Buffer.from("true") : Buffer.from("false");
        }

        return Buffer.from("");
    }
};
