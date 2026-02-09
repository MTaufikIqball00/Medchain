// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalDataRequest - Cross-Hospital Patient Data Request Management
 * @dev Manages cross-hospital data access requests with expiration, rate limiting, and audit trail.
 * Compliant with GDPR - stores only hashes and pseudonymized identifiers, no PII.
 * 
 * Transaction Flow:
 * 1. RS-A requests patient data from RS-B via requestPatientData()
 * 2. RS-B reviews and calls approveRequest() or rejectRequest()
 * 3. If approved, RS-B anchors data hash via anchorDataHash()
 * 4. Access automatically expires after 24 hours
 */
contract MedicalDataRequest {

    // ===== ENUMS =====
    
    enum RequestStatus { 
        PENDING,    // Request created, awaiting response
        APPROVED,   // Request approved, access granted
        REJECTED,   // Request rejected by target hospital
        EXPIRED     // Access period has expired (24 hours after approval)
    }

    // ===== STRUCTS =====
    
    struct DataRequest {
        address requestingHospital;     // Ethereum address of requesting hospital
        address targetHospital;         // Ethereum address of target hospital (data owner)
        bytes32 patientUID;             // Pseudonymized patient identifier (SHA-256 hash)
        bytes32 dataHash;               // Hash of medical data (set after approval)
        uint256 timestamp;              // Request creation timestamp
        uint256 approvedAt;             // Approval timestamp (for expiration calculation)
        uint256 expiresAt;              // Expiration timestamp (approvedAt + 24 hours)
        RequestStatus status;           // Current request status
        string purpose;                 // Purpose of request (e.g., "specialist referral")
        string requestId;               // Unique request identifier for off-chain reference
        bool exists;                    // Flag to check if request exists
    }

    struct Hospital {
        string hospitalId;              // Human-readable ID (e.g., "RS-SILOAM")
        string name;                    // Full hospital name
        bool isRegistered;              // Registration status
        uint256 registeredAt;           // Registration timestamp
        uint256 requestCountThisHour;   // Rate limiting counter
        uint256 lastRequestHour;        // Hour of last request for rate limiting
    }

    // ===== STATE VARIABLES =====
    
    address public admin;
    uint256 public constant ACCESS_DURATION = 24 hours;
    uint256 public constant MAX_REQUESTS_PER_HOUR = 10;
    
    // Mapping from request ID -> DataRequest
    mapping(string => DataRequest) public requests;
    
    // Mapping from hospital address -> Hospital info
    mapping(address => Hospital) public hospitals;
    
    // Array to track all request IDs for enumeration
    string[] public allRequestIds;
    
    // Array to track all registered hospital addresses
    address[] public registeredHospitals;
    
    // Mapping for pending requests per hospital (target hospital -> list of request IDs)
    mapping(address => string[]) public pendingRequestsByHospital;

    // ===== EVENTS =====
    
    event HospitalRegistered(
        address indexed hospitalAddress, 
        string hospitalId, 
        string name, 
        uint256 timestamp
    );
    
    event DataRequestCreated(
        string indexed requestId,
        address indexed requestingHospital,
        address indexed targetHospital,
        bytes32 patientUID,
        string purpose,
        uint256 timestamp
    );
    
    event RequestApproved(
        string indexed requestId,
        address indexed targetHospital,
        address indexed requestingHospital,
        uint256 approvedAt,
        uint256 expiresAt
    );
    
    event RequestRejected(
        string indexed requestId,
        address indexed targetHospital,
        address indexed requestingHospital,
        uint256 timestamp
    );
    
    event DataHashAnchored(
        string indexed requestId,
        bytes32 indexed dataHash,
        address indexed targetHospital,
        uint256 timestamp
    );
    
    event AccessExpired(
        string indexed requestId,
        uint256 timestamp
    );

    // ===== MODIFIERS =====
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredHospital() {
        require(hospitals[msg.sender].isRegistered, "Only registered hospitals can perform this action");
        _;
    }

    modifier onlyTargetHospital(string memory _requestId) {
        require(requests[_requestId].exists, "Request does not exist");
        require(requests[_requestId].targetHospital == msg.sender, "Only target hospital can perform this action");
        _;
    }

    modifier requestExists(string memory _requestId) {
        require(requests[_requestId].exists, "Request does not exist");
        _;
    }

    modifier withinRateLimit() {
        Hospital storage hospital = hospitals[msg.sender];
        uint256 currentHour = block.timestamp / 1 hours;
        
        if (hospital.lastRequestHour != currentHour) {
            hospital.requestCountThisHour = 0;
            hospital.lastRequestHour = currentHour;
        }
        
        require(hospital.requestCountThisHour < MAX_REQUESTS_PER_HOUR, "Rate limit exceeded: max 10 requests per hour");
        hospital.requestCountThisHour++;
        _;
    }

    // ===== CONSTRUCTOR =====
    
    constructor() {
        admin = msg.sender;
    }

    // ===== HOSPITAL REGISTRATION =====
    
    /**
     * @dev Register a new hospital. Only admin can register hospitals.
     * @param _hospitalAddress Ethereum address of the hospital node
     * @param _hospitalId Human-readable hospital ID
     * @param _name Full hospital name
     */
    function registerHospital(
        address _hospitalAddress, 
        string memory _hospitalId, 
        string memory _name
    ) public onlyAdmin {
        require(!hospitals[_hospitalAddress].isRegistered, "Hospital already registered");
        require(bytes(_hospitalId).length > 0, "Hospital ID cannot be empty");
        
        hospitals[_hospitalAddress] = Hospital({
            hospitalId: _hospitalId,
            name: _name,
            isRegistered: true,
            registeredAt: block.timestamp,
            requestCountThisHour: 0,
            lastRequestHour: 0
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

    // ===== CORE DATA REQUEST FUNCTIONS =====
    
    /**
     * @dev Create a new cross-hospital data request
     * @param _requestId Unique request identifier (from off-chain system)
     * @param _targetHospital Address of hospital that owns the data
     * @param _patientUID Pseudonymized patient identifier (already hashed off-chain)
     * @param _purpose Purpose of the data request
     */
    function requestPatientData(
        string memory _requestId,
        address _targetHospital,
        bytes32 _patientUID,
        string memory _purpose
    ) public onlyRegisteredHospital withinRateLimit {
        require(!requests[_requestId].exists, "Request ID already exists");
        require(hospitals[_targetHospital].isRegistered, "Target hospital is not registered");
        require(msg.sender != _targetHospital, "Cannot request data from yourself");
        require(_patientUID != bytes32(0), "Patient UID cannot be empty");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        
        requests[_requestId] = DataRequest({
            requestingHospital: msg.sender,
            targetHospital: _targetHospital,
            patientUID: _patientUID,
            dataHash: bytes32(0),
            timestamp: block.timestamp,
            approvedAt: 0,
            expiresAt: 0,
            status: RequestStatus.PENDING,
            purpose: _purpose,
            requestId: _requestId,
            exists: true
        });
        
        allRequestIds.push(_requestId);
        pendingRequestsByHospital[_targetHospital].push(_requestId);
        
        emit DataRequestCreated(
            _requestId,
            msg.sender,
            _targetHospital,
            _patientUID,
            _purpose,
            block.timestamp
        );
    }

    /**
     * @dev Approve a pending data request (grants 24-hour access)
     * @param _requestId Request ID to approve
     */
    function approveRequest(string memory _requestId) 
        public 
        onlyRegisteredHospital 
        onlyTargetHospital(_requestId) 
    {
        DataRequest storage request = requests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request is not pending");
        
        request.status = RequestStatus.APPROVED;
        request.approvedAt = block.timestamp;
        request.expiresAt = block.timestamp + ACCESS_DURATION;
        
        // Remove from pending list
        _removeFromPendingList(msg.sender, _requestId);
        
        emit RequestApproved(
            _requestId,
            msg.sender,
            request.requestingHospital,
            request.approvedAt,
            request.expiresAt
        );
    }

    /**
     * @dev Reject a pending data request
     * @param _requestId Request ID to reject
     */
    function rejectRequest(string memory _requestId) 
        public 
        onlyRegisteredHospital 
        onlyTargetHospital(_requestId) 
    {
        DataRequest storage request = requests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request is not pending");
        
        request.status = RequestStatus.REJECTED;
        
        // Remove from pending list
        _removeFromPendingList(msg.sender, _requestId);
        
        emit RequestRejected(
            _requestId,
            msg.sender,
            request.requestingHospital,
            block.timestamp
        );
    }

    /**
     * @dev Anchor data hash after request is approved
     * @param _requestId Request ID
     * @param _dataHash SHA-256 hash of the medical data being shared
     */
    function anchorDataHash(string memory _requestId, bytes32 _dataHash) 
        public 
        onlyRegisteredHospital 
        onlyTargetHospital(_requestId) 
    {
        DataRequest storage request = requests[_requestId];
        require(request.status == RequestStatus.APPROVED, "Request is not approved");
        require(block.timestamp <= request.expiresAt, "Access has expired");
        require(_dataHash != bytes32(0), "Data hash cannot be empty");
        
        request.dataHash = _dataHash;
        
        emit DataHashAnchored(
            _requestId,
            _dataHash,
            msg.sender,
            block.timestamp
        );
    }

    // ===== VIEW FUNCTIONS =====
    
    /**
     * @dev Get request status (considering expiration)
     * @param _requestId Request ID to check
     * @return Current status (may differ from stored if expired)
     */
    function getRequestStatus(string memory _requestId) 
        public 
        view 
        requestExists(_requestId) 
        returns (RequestStatus) 
    {
        DataRequest memory request = requests[_requestId];
        
        // Check if approved request has expired
        if (request.status == RequestStatus.APPROVED && block.timestamp > request.expiresAt) {
            return RequestStatus.EXPIRED;
        }
        
        return request.status;
    }

    /**
     * @dev Check if access is currently active (approved and not expired)
     * @param _requestId Request ID to check
     */
    function isAccessActive(string memory _requestId) 
        public 
        view 
        requestExists(_requestId) 
        returns (bool) 
    {
        DataRequest memory request = requests[_requestId];
        return request.status == RequestStatus.APPROVED && block.timestamp <= request.expiresAt;
    }

    /**
     * @dev Get full request details
     * @param _requestId Request ID
     */
    function getRequest(string memory _requestId) 
        public 
        view 
        requestExists(_requestId) 
        returns (
            address requestingHospital,
            address targetHospital,
            bytes32 patientUID,
            bytes32 dataHash,
            uint256 timestamp,
            uint256 approvedAt,
            uint256 expiresAt,
            RequestStatus status,
            string memory purpose
        ) 
    {
        DataRequest memory request = requests[_requestId];
        
        // Adjust status if expired
        RequestStatus currentStatus = request.status;
        if (currentStatus == RequestStatus.APPROVED && block.timestamp > request.expiresAt) {
            currentStatus = RequestStatus.EXPIRED;
        }
        
        return (
            request.requestingHospital,
            request.targetHospital,
            request.patientUID,
            request.dataHash,
            request.timestamp,
            request.approvedAt,
            request.expiresAt,
            currentStatus,
            request.purpose
        );
    }

    /**
     * @dev Get pending requests count for a hospital
     * @param _hospital Hospital address
     */
    function getPendingRequestsCount(address _hospital) public view returns (uint256) {
        return pendingRequestsByHospital[_hospital].length;
    }

    /**
     * @dev Get pending request IDs for a hospital
     * @param _hospital Hospital address
     */
    function getPendingRequestIds(address _hospital) public view returns (string[] memory) {
        return pendingRequestsByHospital[_hospital];
    }

    /**
     * @dev Get total request count
     */
    function getTotalRequestCount() public view returns (uint256) {
        return allRequestIds.length;
    }

    /**
     * @dev Get total registered hospitals count
     */
    function getHospitalCount() public view returns (uint256) {
        return registeredHospitals.length;
    }

    /**
     * @dev Get remaining rate limit for a hospital
     * @param _hospital Hospital address
     */
    function getRemainingRateLimit(address _hospital) public view returns (uint256) {
        Hospital memory hospital = hospitals[_hospital];
        uint256 currentHour = block.timestamp / 1 hours;
        
        if (hospital.lastRequestHour != currentHour) {
            return MAX_REQUESTS_PER_HOUR;
        }
        
        if (hospital.requestCountThisHour >= MAX_REQUESTS_PER_HOUR) {
            return 0;
        }
        
        return MAX_REQUESTS_PER_HOUR - hospital.requestCountThisHour;
    }

    // ===== INTERNAL FUNCTIONS =====
    
    /**
     * @dev Remove request ID from hospital's pending list
     */
    function _removeFromPendingList(address _hospital, string memory _requestId) internal {
        string[] storage pendingList = pendingRequestsByHospital[_hospital];
        
        for (uint256 i = 0; i < pendingList.length; i++) {
            if (keccak256(bytes(pendingList[i])) == keccak256(bytes(_requestId))) {
                // Move last element to current position and pop
                pendingList[i] = pendingList[pendingList.length - 1];
                pendingList.pop();
                break;
            }
        }
    }

    // ===== ADMIN FUNCTIONS =====
    
    /**
     * @dev Transfer admin rights (for contract upgrades)
     * @param _newAdmin Address of new admin
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        admin = _newAdmin;
    }

    /**
     * @dev Mark expired requests (can be called by anyone for gas optimization)
     * This is optional - getRequestStatus already handles expiration dynamically
     * @param _requestId Request ID to check and mark as expired
     */
    function markExpired(string memory _requestId) public requestExists(_requestId) {
        DataRequest storage request = requests[_requestId];
        
        if (request.status == RequestStatus.APPROVED && block.timestamp > request.expiresAt) {
            request.status = RequestStatus.EXPIRED;
            emit AccessExpired(_requestId, block.timestamp);
        }
    }
}
