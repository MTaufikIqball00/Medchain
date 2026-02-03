// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalAnchor - National Health Integrity & Access Control
 * @dev Stores immutable proofs of medical records AND manages inter-hospital access.
 * Supports GDPR compliance by NOT storing any PII, only cryptographic hashes.
 */
contract MedicalAnchor {

    // ===== STRUCTS =====
    
    struct RecordProof {
        bytes32 dataHash;       // SHA-256 Hash of the encrypted off-chain data
        uint256 timestamp;
        address hospitalNode;   // Address of the authorized hospital node
        string fabricTxId;      // Link to Hyperledger Fabric Transaction ID
        bool exists;
    }

    struct AccessRequest {
        address requester;      // Hospital requesting access
        address owner;          // Hospital that owns the record
        string recordId;        // Fabric record ID
        uint256 requestedAt;
        bool approved;
        bool pending;
    }

    struct Hospital {
        string hospitalId;      // Human-readable ID (e.g., "RS-HASAN-SADIKIN")
        string name;
        bool isRegistered;
        uint256 registeredAt;
    }

    // ===== STATE VARIABLES =====
    
    address public admin;
    
    // Mapping from Fabric Record ID -> Proof
    mapping(string => RecordProof) public proofs;
    
    // Mapping from hospital address -> Hospital info
    mapping(address => Hospital) public hospitals;
    
    // Mapping from recordId -> hospital address -> hasAccess
    mapping(string => mapping(address => bool)) public accessPermissions;
    
    // Access requests: recordId -> requester address -> AccessRequest
    mapping(string => mapping(address => AccessRequest)) public accessRequests;
    
    // Array to track all registered hospital addresses
    address[] public registeredHospitals;

    // ===== EVENTS =====
    
    event HospitalRegistered(address indexed hospitalAddress, string hospitalId, string name, uint256 timestamp);
    event ProofAnchored(string indexed fabricTxId, bytes32 indexed dataHash, address indexed hospital, uint256 timestamp);
    event AccessRequested(string indexed recordId, address indexed requester, address indexed owner, uint256 timestamp);
    event AccessGranted(string indexed recordId, address indexed owner, address indexed grantedTo, uint256 timestamp);
    event AccessRevoked(string indexed recordId, address indexed owner, address indexed revokedFrom, uint256 timestamp);

    // ===== MODIFIERS =====
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredHospital() {
        require(hospitals[msg.sender].isRegistered, "Only registered hospitals can perform this action");
        _;
    }

    modifier onlyRecordOwner(string memory _recordId) {
        require(proofs[_recordId].exists, "Record does not exist");
        require(proofs[_recordId].hospitalNode == msg.sender, "Only record owner can perform this action");
        _;
    }

    // ===== CONSTRUCTOR =====
    
    constructor() {
        admin = msg.sender;
    }

    // ===== HOSPITAL REGISTRATION =====
    
    /**
     * @dev Register a new hospital. Only admin can register hospitals.
     */
    function registerHospital(
        address _hospitalAddress, 
        string memory _hospitalId, 
        string memory _name
    ) public onlyAdmin {
        require(!hospitals[_hospitalAddress].isRegistered, "Hospital already registered");
        
        hospitals[_hospitalAddress] = Hospital({
            hospitalId: _hospitalId,
            name: _name,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        
        registeredHospitals.push(_hospitalAddress);
        
        emit HospitalRegistered(_hospitalAddress, _hospitalId, _name, block.timestamp);
    }

    /**
     * @dev Check if an address is a registered hospital
     */
    function isHospitalRegistered(address _address) public view returns (bool) {
        return hospitals[_address].isRegistered;
    }

    // ===== TRUST ANCHOR FUNCTIONS =====
    
    /**
     * @dev Anchors a new hash to the public blockchain.
     * This serves as the "Trust Anchor" to verify data hasn't been tampered with off-chain.
     */
    function anchorHash(
        string memory _fabricTxId, 
        string memory _hashString
    ) public onlyRegisteredHospital {
        require(!proofs[_fabricTxId].exists, "Proof already exists for this transaction");

        bytes32 _hash = keccak256(abi.encodePacked(_hashString));

        proofs[_fabricTxId] = RecordProof({
            dataHash: _hash,
            timestamp: block.timestamp,
            hospitalNode: msg.sender,
            fabricTxId: _fabricTxId,
            exists: true
        });
        
        // Owner automatically has access to their own record
        accessPermissions[_fabricTxId][msg.sender] = true;

        emit ProofAnchored(_fabricTxId, _hash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify data integrity by comparing hash
     */
    function verifyIntegrity(
        string memory _fabricTxId, 
        string memory _candidateHashString
    ) public view returns (bool) {
        require(proofs[_fabricTxId].exists, "Record does not exist");
        bytes32 _candidateHash = keccak256(abi.encodePacked(_candidateHashString));
        return proofs[_fabricTxId].dataHash == _candidateHash;
    }

    /**
     * @dev Get record proof details
     */
    function getProof(string memory _fabricTxId) public view returns (
        bytes32 dataHash,
        uint256 timestamp,
        address hospitalNode,
        bool exists
    ) {
        RecordProof memory proof = proofs[_fabricTxId];
        return (proof.dataHash, proof.timestamp, proof.hospitalNode, proof.exists);
    }

    // ===== ACCESS CONTROL FUNCTIONS =====
    
    /**
     * @dev Request access to a medical record from another hospital
     */
    function requestAccess(
        string memory _recordId,
        address _ownerHospital
    ) public onlyRegisteredHospital {
        require(proofs[_recordId].exists, "Record does not exist");
        require(proofs[_recordId].hospitalNode == _ownerHospital, "Specified address is not the record owner");
        require(msg.sender != _ownerHospital, "Cannot request access to own record");
        require(!accessPermissions[_recordId][msg.sender], "Already has access");
        require(!accessRequests[_recordId][msg.sender].pending, "Request already pending");

        accessRequests[_recordId][msg.sender] = AccessRequest({
            requester: msg.sender,
            owner: _ownerHospital,
            recordId: _recordId,
            requestedAt: block.timestamp,
            approved: false,
            pending: true
        });

        emit AccessRequested(_recordId, msg.sender, _ownerHospital, block.timestamp);
    }

    /**
     * @dev Grant access to a requesting hospital (only record owner can grant)
     */
    function grantAccess(
        string memory _recordId,
        address _requesterHospital
    ) public onlyRecordOwner(_recordId) {
        require(accessRequests[_recordId][_requesterHospital].pending, "No pending request from this hospital");
        
        accessRequests[_recordId][_requesterHospital].approved = true;
        accessRequests[_recordId][_requesterHospital].pending = false;
        accessPermissions[_recordId][_requesterHospital] = true;

        emit AccessGranted(_recordId, msg.sender, _requesterHospital, block.timestamp);
    }

    /**
     * @dev Revoke access from a hospital (only record owner can revoke)
     */
    function revokeAccess(
        string memory _recordId,
        address _hospitalToRevoke
    ) public onlyRecordOwner(_recordId) {
        require(accessPermissions[_recordId][_hospitalToRevoke], "Hospital does not have access");
        require(_hospitalToRevoke != msg.sender, "Cannot revoke own access");
        
        accessPermissions[_recordId][_hospitalToRevoke] = false;
        
        emit AccessRevoked(_recordId, msg.sender, _hospitalToRevoke, block.timestamp);
    }

    /**
     * @dev Check if a hospital has access to a record
     */
    function hasAccess(
        string memory _recordId,
        address _hospital
    ) public view returns (bool) {
        return accessPermissions[_recordId][_hospital];
    }

    /**
     * @dev Get access request details
     */
    function getAccessRequest(
        string memory _recordId,
        address _requester
    ) public view returns (
        address requester,
        address owner,
        uint256 requestedAt,
        bool approved,
        bool pending
    ) {
        AccessRequest memory req = accessRequests[_recordId][_requester];
        return (req.requester, req.owner, req.requestedAt, req.approved, req.pending);
    }

    /**
     * @dev Get hospital info
     */
    function getHospitalInfo(address _hospital) public view returns (
        string memory hospitalId,
        string memory name,
        bool isRegistered,
        uint256 registeredAt
    ) {
        Hospital memory h = hospitals[_hospital];
        return (h.hospitalId, h.name, h.isRegistered, h.registeredAt);
    }

    /**
     * @dev Get total registered hospitals count
     */
    function getHospitalCount() public view returns (uint256) {
        return registeredHospitals.length;
    }
}
