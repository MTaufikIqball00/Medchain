/**
 * End-to-End Test Script: Cross-Hospital Data Request Flow
 * 
 * This script simulates the complete workflow:
 * 1. RS-A requests patient data from RS-B
 * 2. RS-B approves the request
 * 3. RS-B anchors data hash
 * 4. RS-A checks status and accesses data
 * 
 * Prerequisites:
 * - Ganache running on http://localhost:8545
 * - MedicalDataRequest contract deployed
 * - API server running on http://localhost:4000
 * - Hospitals RS-A and RS-B registered
 * 
 * Usage: node scripts/test_data_request_flow.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000';

// Test credentials (must match registered hospitals)
const hospitals = {
    'RS-A': {
        id: 'RS-A',
        password: 'hospital123',
        token: null
    },
    'RS-B': {
        id: 'RS-B',
        password: 'hospital123',
        token: null
    },
    'RS-C': {
        id: 'RS-HASAN-SADIKIN',
        password: 'hospital123',
        token: null
    }
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
    console.log(`\n${colors.cyan}[Step ${step}]${colors.reset} ${description}`);
    console.log('─'.repeat(50));
}

async function registerHospital(hospitalId, name, password = 'hospital123') {
    try {
        const response = await axios.post(`${API_BASE}/api/hospitals/register`, {
            hospital_id: hospitalId,
            name: name,
            password: password
        });
        log(`  ✅ Hospital ${hospitalId} registered`, 'green');
        return response.data;
    } catch (error) {
        if (error.response?.data?.error?.includes('already')) {
            log(`  ℹ️  Hospital ${hospitalId} already exists`, 'yellow');
            return { success: true, existing: true };
        }
        throw error;
    }
}

async function login(hospital) {
    try {
        const response = await axios.post(`${API_BASE}/api/hospitals/login`, {
            hospital_id: hospital.id,
            password: hospital.password
        });
        hospital.token = response.data.token;
        log(`  ✅ ${hospital.id} logged in successfully`, 'green');
        return response.data;
    } catch (error) {
        log(`  ❌ Login failed for ${hospital.id}: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function createDataRequest(requester, targetHospitalId, patientUID, purpose, requestedDataTypes = []) {
    try {
        const response = await axios.post(
            `${API_BASE}/api/data-request/create`,
            {
                targetHospitalId,
                patientUID,
                purpose,
                requestedDataTypes
            },
            {
                headers: { Authorization: `Bearer ${requester.token}` }
            }
        );
        log(`  ✅ Data request created: ${response.data.data.request_id}`, 'green');
        log(`     From: ${requester.id} → To: ${targetHospitalId}`, 'blue');
        log(`     Purpose: ${purpose}`, 'blue');
        if (response.data.data.eth_tx_hash) {
            log(`     ETH TX: ${response.data.data.eth_tx_hash}`, 'yellow');
        }
        return response.data;
    } catch (error) {
        log(`  ❌ Create request failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function approveRequest(approver, requestId) {
    try {
        const response = await axios.post(
            `${API_BASE}/api/data-request/approve/${requestId}`,
            {},
            {
                headers: { Authorization: `Bearer ${approver.token}` }
            }
        );
        log(`  ✅ Request ${requestId} APPROVED by ${approver.id}`, 'green');
        log(`     Expires at: ${response.data.data.expires_at}`, 'blue');
        if (response.data.data.eth_tx_hash) {
            log(`     ETH TX: ${response.data.data.eth_tx_hash}`, 'yellow');
        }
        return response.data;
    } catch (error) {
        log(`  ❌ Approve failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function rejectRequest(rejecter, requestId, reason = '') {
    try {
        const response = await axios.post(
            `${API_BASE}/api/data-request/reject/${requestId}`,
            { reason },
            {
                headers: { Authorization: `Bearer ${rejecter.token}` }
            }
        );
        log(`  ❌ Request ${requestId} REJECTED by ${rejecter.id}`, 'red');
        if (reason) {
            log(`     Reason: ${reason}`, 'yellow');
        }
        return response.data;
    } catch (error) {
        log(`  ❌ Reject failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function getRequestStatus(hospital, requestId) {
    try {
        const response = await axios.get(
            `${API_BASE}/api/data-request/status/${requestId}`,
            {
                headers: { Authorization: `Bearer ${hospital.token}` }
            }
        );
        const data = response.data.data;
        log(`  📋 Request Status: ${data.status}`, data.is_access_active ? 'green' : 'yellow');
        log(`     Access Active: ${data.is_access_active ? 'YES' : 'NO'}`, 'blue');
        log(`     Your Role: ${data.your_role}`, 'blue');
        return response.data;
    } catch (error) {
        log(`  ❌ Get status failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function getPendingRequests(hospital) {
    try {
        const response = await axios.get(
            `${API_BASE}/api/data-request/pending`,
            {
                headers: { Authorization: `Bearer ${hospital.token}` }
            }
        );
        log(`  📬 Pending requests for ${hospital.id}: ${response.data.count}`, 'blue');
        return response.data;
    } catch (error) {
        log(`  ❌ Get pending failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

async function anchorDataHash(hospital, requestId, dataHash) {
    try {
        const response = await axios.post(
            `${API_BASE}/api/data-request/anchor-hash/${requestId}`,
            { dataHash },
            {
                headers: { Authorization: `Bearer ${hospital.token}` }
            }
        );
        log(`  ✅ Data hash anchored for ${requestId}`, 'green');
        if (response.data.data.eth_tx_hash) {
            log(`     ETH TX: ${response.data.data.eth_tx_hash}`, 'yellow');
        }
        return response.data;
    } catch (error) {
        log(`  ❌ Anchor hash failed: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
    }
}

// ===== TEST SCENARIOS =====

async function runTestSuite() {
    console.log('\n' + '═'.repeat(60));
    console.log('   CROSS-HOSPITAL DATA REQUEST FLOW - END-TO-END TEST');
    console.log('═'.repeat(60));

    try {
        // Setup: Register and login hospitals
        logStep(0, 'Setup: Register and Login Hospitals');

        await registerHospital('RS-A', 'Rumah Sakit A (Siloam Jakarta)');
        await registerHospital('RS-B', 'Rumah Sakit B (Harapan Kita)');
        await registerHospital('RS-HASAN-SADIKIN', 'RS Hasan Sadikin Bandung');

        await login(hospitals['RS-A']);
        await login(hospitals['RS-B']);
        await login(hospitals['RS-C']);

        // Scenario 1: RS-A requests data from RS-B → RS-B approves
        logStep(1, 'Scenario 1: RS-A requests data from RS-B → APPROVED');

        const request1 = await createDataRequest(
            hospitals['RS-A'],
            'RS-B',
            'PAT-12345-JOHN-DOE',
            'Specialist referral - cardiology consultation',
            ['lab results', 'ECG', 'diagnosis history']
        );
        const requestId1 = request1.data.request_id;

        // Check pending at RS-B
        await getPendingRequests(hospitals['RS-B']);

        // RS-B approves
        await approveRequest(hospitals['RS-B'], requestId1);

        // RS-B anchors data hash
        const medicalDataHash = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        await anchorDataHash(hospitals['RS-B'], requestId1, medicalDataHash);

        // RS-A checks status
        await getRequestStatus(hospitals['RS-A'], requestId1);

        // Scenario 2: RS-A requests data from RS-HASAN-SADIKIN → REJECTED
        logStep(2, 'Scenario 2: RS-A requests data from RS-HASAN-SADIKIN → REJECTED');

        const request2 = await createDataRequest(
            hospitals['RS-A'],
            'RS-HASAN-SADIKIN',
            'PAT-67890-JANE-DOE',
            'Second opinion request',
            ['MRI scan', 'specialist notes']
        );
        const requestId2 = request2.data.request_id;

        // RS-HASAN-SADIKIN rejects
        await rejectRequest(
            hospitals['RS-C'],
            requestId2,
            'Patient consent not yet obtained'
        );

        // Check status
        await getRequestStatus(hospitals['RS-A'], requestId2);

        // Scenario 3: Parallel requests from multiple hospitals
        logStep(3, 'Scenario 3: Parallel requests to RS-B');

        const parallelRequest1 = await createDataRequest(
            hospitals['RS-A'],
            'RS-B',
            'PAT-PARALLEL-001',
            'Emergency transfer case',
            ['all records']
        );

        const parallelRequest2 = await createDataRequest(
            hospitals['RS-C'],
            'RS-B',
            'PAT-PARALLEL-002',
            'Research collaboration',
            ['anonymized data']
        );

        await getPendingRequests(hospitals['RS-B']);

        // RS-B approves both
        await approveRequest(hospitals['RS-B'], parallelRequest1.data.request_id);
        await approveRequest(hospitals['RS-B'], parallelRequest2.data.request_id);

        // Final summary
        logStep(4, 'Test Summary');
        log('  ✅ All test scenarios completed successfully!', 'green');
        console.log('\n  Results:');
        console.log(`    - Scenario 1 (Approve flow): ✅ PASSED`);
        console.log(`    - Scenario 2 (Reject flow):  ✅ PASSED`);
        console.log(`    - Scenario 3 (Parallel):     ✅ PASSED`);

    } catch (error) {
        log(`\n  ❌ Test failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('   TEST SUITE COMPLETED');
    console.log('═'.repeat(60) + '\n');
}

// Run the test suite
runTestSuite();
