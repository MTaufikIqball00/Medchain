// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedChain Proof Ledger
 * @dev Stores immutable proofs (hashes) of medical records stored in Private Fabric.
 */
contract MedChain {

    struct RecordProof {
        string recordId;      // ID from Hyperledger Fabric
        string dataHash;      // SHA-256 Hash of the data
        uint256 timestamp;
        address recorder;     // Wallet address of the doctor/hospital
    }

    // Mapping from Fabric Record ID to Proof
    mapping(string => RecordProof) public proofs;

    // Array to keep track of all IDs (for enumeration if needed)
    string[] public recordIds;

    event ProofCreated(string indexed recordId, string dataHash, address indexed recorder, uint256 timestamp);

    /**
     * @dev Store a new proof on the blockchain.
     * @param _recordId The ID returned by Hyperledger Fabric
     * @param _dataHash The SHA-256 hash of the medical record JSON
     */
    function submitProof(string memory _recordId, string memory _dataHash) public {
        // Validation: Ensure record doesn't already exist (optional, maybe updates are allowed?)
        // For now, assume immutable: cannot overwrite.
        require(bytes(proofs[_recordId].recordId).length == 0, "Record proof already exists");

        RecordProof memory newProof = RecordProof({
            recordId: _recordId,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        });

        proofs[_recordId] = newProof;
        recordIds.push(_recordId);

        emit ProofCreated(_recordId, _dataHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify if a local hash matches the on-chain proof
     */
    function verifyIntegrity(string memory _recordId, string memory _computedHash) public view returns (bool) {
        return keccak256(bytes(proofs[_recordId].dataHash)) == keccak256(bytes(_computedHash));
    }

    function getProof(string memory _recordId) public view returns (RecordProof memory) {
        return proofs[_recordId];
    }
}
