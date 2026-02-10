const { ethers } = require("hardhat");

async function main() {
    const [deployer, rsA, rsB] = await ethers.getSigners();

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const contract = await ethers.getContractAt("MedicalDataRequest", contractAddress);

    // Check registrations
    console.log("=== Hospital Registration Check ===");
    console.log("RS-A registered:", await contract.isHospitalRegistered(rsA.address));
    console.log("RS-B registered:", await contract.isHospitalRegistered(rsB.address));
    console.log("RS-A address:", rsA.address);
    console.log("RS-B address:", rsB.address);

    // Try to call requestPatientData as RS-B
    const requestId = `REQ-DEBUG-${Date.now()}`;
    const targetAddress = rsA.address; // RS-A
    const patientUID = ethers.keccak256(ethers.toUtf8Bytes("RM-555"));
    const purpose = "Emergency Access - Prototype";

    console.log("\n=== Attempting requestPatientData as RS-B ===");
    console.log("Request ID:", requestId);
    console.log("Target (RS-A):", targetAddress);
    console.log("Patient UID (bytes32):", patientUID);
    console.log("Purpose:", purpose);

    try {
        const tx = await contract.connect(rsB).requestPatientData(
            requestId,
            targetAddress,
            patientUID,
            purpose
        );
        const receipt = await tx.wait();
        console.log("\n✅ SUCCESS! TX Hash:", receipt.hash);
    } catch (error) {
        console.log("\n❌ FAILED!");
        console.log("Error reason:", error.reason);
        console.log("Error message:", error.message);
        if (error.data) console.log("Error data:", error.data);
    }
}

main().catch(console.error);
