const axios = require('axios');

async function runTest() {
    const API_URL = 'http://localhost:4000/api';
    const HOSPITAL_A = 'HOSP_A';
    const HOSPITAL_B = 'HOSP_B';
    const CLINICAL_DATA = { diagnosis: "Flu", notes: "Rest and water" };

    console.log("=== STARTING ACCESS CONTROL & VERIFICATION TEST ===");

    try {
        // 1. Hospital A Creates Record
        console.log("\n1. [HOSP_A] Creating Record...");
        const createRes = await axios.post(`${API_URL}/records/create`, {
            patientUid: "PATIENT_001",
            hospitalId: HOSPITAL_A,
            clinicalData: CLINICAL_DATA,
            description: "Visit 1"
        });
        const recordId = createRes.data.recordId;
        console.log(`   -> Created Record: ${recordId}`);

        // 2. Hospital B Tries to Read (Should Fail)
        console.log("\n2. [HOSP_B] Trying to Read Record...");
        try {
            await axios.get(`${API_URL}/records/${recordId}?requesterId=${HOSPITAL_B}`);
        } catch (err) {
            console.log(`   -> Expected Error: ${err.response ? err.response.data.error : err.message}`);
        }

        // 3. Hospital B Requests Access
        console.log("\n3. [HOSP_B] Requesting Access...");
        await axios.post(`${API_URL}/access/request`, {
            recordId,
            requesterId: HOSPITAL_B
        });
        console.log("   -> Access Requested.");

        // 4. Hospital A Grants Access
        console.log("\n4. [HOSP_A] Granting Access to HOSP_B...");
        await axios.post(`${API_URL}/access/approve`, {
            recordId,
            targetHospitalId: HOSPITAL_B
        });
        console.log("   -> Access Granted.");

        // 5. Hospital B Reads (Should Success)
        console.log("\n5. [HOSP_B] Trying to Read Record (Again)...");
        const readRes = await axios.get(`${API_URL}/records/${recordId}?requesterId=${HOSPITAL_B}`);
        console.log(`   -> Success! Data: ${JSON.stringify(readRes.data.data)}`);

        // 6. Verify Integrity
        console.log("\n6. [HOSP_B] Verifying Integrity...");
        const verifyRes = await axios.post(`${API_URL}/records/verify`, {
            recordId,
            clinicalData: CLINICAL_DATA,
            requesterId: HOSPITAL_B
        });
        console.log(`   -> Integrity Match: ${verifyRes.data.isMatch}`);

        console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");

    } catch (error) {
        console.error("\n!!! TEST FAILED !!!");
        console.error(error.response ? error.response.data : error.message);
    }
}

runTest();
