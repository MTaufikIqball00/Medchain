// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedChain Medical Record Ledger
 * @dev Smart Contract to anchor cryptographic hashes of medical records for integrity verification.
 */
contract MedChain {
    
    // Struct for storing record integrity proofs (no raw PII)
    struct Record {
        uint256 id;
        uint256 timestamp;
        string patientId;     // Pseudonymized Patient ID (e.g., PAT-XXXX)
        string department;    // Department (e.g., Cardiology, General)
        string dataHash;      // SHA-256 Hash of medical data
        address doctor;       // Wallet Address of submitting doctor
    }

    // State Variables
    mapping(uint256 => Record) public records;
    uint256 public recordCount;
    
    // Access Control
    address public admin;
    mapping(address => bool) public authorizedDoctors;

    // Events
    event RecordAdded(uint256 indexed id, string patientId, address indexed doctor, uint256 timestamp);
    event DoctorAuthorized(address indexed doctor);
    event DoctorRevoked(address indexed doctor);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Access Denied: Admin only");
        _;
    }

    modifier onlyDoctor() {
        require(authorizedDoctors[msg.sender] || msg.sender == admin, "Access Denied: Doctor not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedDoctors[msg.sender] = true;
    }

    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }

    function authorizeDoctor(address _doctorAddress) public onlyAdmin {
        require(_doctorAddress != address(0), "Invalid doctor address");
        authorizedDoctors[_doctorAddress] = true;
        emit DoctorAuthorized(_doctorAddress);
    }

    function revokeDoctor(address _doctorAddress) public onlyAdmin {
        require(authorizedDoctors[_doctorAddress], "Doctor is not authorized");
        authorizedDoctors[_doctorAddress] = false;
        emit DoctorRevoked(_doctorAddress);
    }

    function addRecord(
        string memory _patientId, 
        string memory _department, 
        string memory _dataHash
    ) public onlyDoctor {
        require(bytes(_patientId).length > 0, "Patient ID cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");

        recordCount++;
        records[recordCount] = Record(
            recordCount,
            block.timestamp,
            _patientId,
            _department,
            _dataHash,
            msg.sender
        );
        
        emit RecordAdded(recordCount, _patientId, msg.sender, block.timestamp);
    }

    function getRecord(uint256 _id) public view returns (
        uint256 id,
        uint256 timestamp,
        string memory patientId,
        string memory department,
        string memory dataHash,
        address doctor
    ) {
        require(_id > 0 && _id <= recordCount, "Record does not exist");
        Record memory r = records[_id];
        return (r.id, r.timestamp, r.patientId, r.department, r.dataHash, r.doctor);
    }

    function verifyIntegrity(uint256 _id, string memory _comparisonHash) public view returns (bool) {
        require(_id > 0 && _id <= recordCount, "Record does not exist");
        return keccak256(abi.encodePacked(records[_id].dataHash)) == keccak256(abi.encodePacked(_comparisonHash));
    }
}