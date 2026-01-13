// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title National Health Integrity Anchor
 * @dev Stores immutable proofs of medical records.
 * Supports GDPR compliance by NOT storing any PII, only cryptographic hashes.
 */
contract MedicalAnchor {

    struct RecordProof {
        bytes32 dataHash;      // SHA-256 Hash of the encrypted off-chain data
        uint256 timestamp;
        address hospitalNode;  // Address of the authorized hospital node
        string metaId;         // Link to Hyperledger Fabric Metadata ID
    }

    // Mapping from Fabric Record ID -> Proof
    mapping(string => RecordProof) public proofs;

    event ProofAnchored(string indexed metaId, bytes32 indexed dataHash, address indexed hospital, uint256 timestamp);

    modifier onlyAuthorizedHospital() {
        // In a real system, we would check a registry of authorized hospital wallets
        _;
    }

    /**
     * @dev Anchors a new hash to the public blockchain.
     * This serves as the "Trust Anchor" to verify data hasn't been tampered with off-chain.
     */
    function anchorHash(string memory _metaId, string memory _hashString) public onlyAuthorizedHospital {
        require(proofs[_metaId].timestamp == 0, "Proof already exists");

        // Convert string hash to bytes32 for gas efficiency if input is 32-byte hex
        // For simplicity here, we assume the input is verified off-chain or handle generic bytes32
        bytes32 _hash = keccak256(abi.encodePacked(_hashString));

        proofs[_metaId] = RecordProof({
            dataHash: _hash,
            timestamp: block.timestamp,
            hospitalNode: msg.sender,
            metaId: _metaId
        });

        emit ProofAnchored(_metaId, _hash, msg.sender, block.timestamp);
    }

    function verifyIntegrity(string memory _metaId, string memory _candidateHashString) public view returns (bool) {
        bytes32 _candidateHash = keccak256(abi.encodePacked(_candidateHashString));
        return proofs[_metaId].dataHash == _candidateHash;
    }
}
