// Native fetch is available in Node 18+
// const { fetch } = require('undici');

async function demo() {
    const API_URL = 'http://localhost:4000/api/records';

    console.log("=== STARTING CRUD DEMO ===");

    // 1. CREATE
    console.log("\n1. [CREATE] Creating new record...");
    try {
        let res = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientUid: "UID-DEMO-123",
                hospitalId: "HOSP-001",
                description: "Initial Checkup",
                clinicalData: { diagnosis: "Healthy", temperature: 36.5 }
            })
        });
        if (!res.ok) throw new Error(`Create Failed: ${res.statusText}`);

        let json = await res.json();
        console.log("   Create Response:", json);
        const recordId = json.recordId;

        if (!recordId) {
            console.error("Failed to create record");
            return;
        }

        // 2. READ
        console.log(`\n2. [READ] Reading record ${recordId}...`);
        res = await fetch(`${API_URL}/${recordId}`);
        json = await res.json();
        console.log("   Read Data:", json.data);

        // 3. UPDATE
        console.log("\n3. [UPDATE] Updating record (Right to Rectification)...");
        res = await fetch(`${API_URL}/${recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hospitalId: "HOSP-001",
                description: "Follow Up",
                clinicalData: { diagnosis: "Mild Fever", temperature: 37.2, note: "Updated condition" }
            })
        });
        json = await res.json();
        console.log("   Update Response:", json);

        // 4. READ AGAIN
        console.log("\n4. [READ] Verifying update...");
        res = await fetch(`${API_URL}/${recordId}`);
        json = await res.json();
        console.log("   Read Data (Version 2):", json.data);

        // 5. DELETE
        console.log("\n5. [DELETE] Deleting record (Right to Erasure)...");
        res = await fetch(`${API_URL}/${recordId}`, { method: 'DELETE' });
        json = await res.json();
        console.log("   Delete Response:", json);

        // 6. READ FINAL (Expect Failure)
        console.log("\n6. [READ] Trying to read deleted record...");
        res = await fetch(`${API_URL}/${recordId}`);
        if (res.status === 410) {
            console.log("   SUCCESS: Server returned 410 Gone (Deleted).");
        } else {
            console.log("   UNEXPECTED: ", await res.json());
        }

    } catch (e) {
        console.error("Demo failed:", e);
    }
}

demo().catch(console.error);
