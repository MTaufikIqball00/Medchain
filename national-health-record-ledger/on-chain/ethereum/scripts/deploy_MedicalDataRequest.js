const { ethers } = require("hardhat");

async function main() {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║   MedicalDataRequest Contract Deployment                       ║");
    console.log("║   Cross-Hospital Patient Data Request Management               ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    // Get signers (accounts from Ganache)
    const [admin, hospitalA, hospitalB, hospitalC, hospitalD, hospitalE] = await ethers.getSigners();

    console.log("📋 Deployer (Admin):", admin.address);
    console.log("💰 Admin Balance:", ethers.formatEther(await ethers.provider.getBalance(admin.address)), "ETH\n");

    // Deploy contract
    console.log("🚀 Deploying MedicalDataRequest contract...");
    const MedicalDataRequest = await ethers.getContractFactory("MedicalDataRequest");
    const contract = await MedicalDataRequest.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    console.log("📦 Block number:", await ethers.provider.getBlockNumber());

    // Register hospitals
    console.log("\n🏥 Registering hospitals...\n");

    const hospitals = [
        { address: hospitalA.address, id: "RS-A", name: "Rumah Sakit A (Siloam Jakarta)" },
        { address: hospitalB.address, id: "RS-B", name: "Rumah Sakit B (Harapan Kita)" },
        { address: hospitalC.address, id: "RS-HASAN-SADIKIN", name: "RS Hasan Sadikin Bandung" },
        { address: hospitalD.address, id: "RS-SILOAM", name: "RS Siloam Kebon Jeruk" },
        { address: hospitalE.address, id: "RS-HERMINA", name: "RS Hermina Kemayoran" }
    ];

    for (const hospital of hospitals) {
        try {
            const tx = await contract.registerHospital(hospital.address, hospital.id, hospital.name);
            await tx.wait();
            console.log(`   ✅ Registered: ${hospital.id}`);
            console.log(`      Address: ${hospital.address}`);
        } catch (error) {
            console.log(`   ❌ Failed to register ${hospital.id}: ${error.message}`);
        }
    }

    // Verify registrations
    console.log("\n📊 Verification:");
    const hospitalCount = await contract.getHospitalCount();
    console.log(`   Total registered hospitals: ${hospitalCount}`);

    // Output configuration for .env
    console.log("\n" + "═".repeat(60));
    console.log("📋 ADD TO YOUR .env FILE:");
    console.log("═".repeat(60));
    console.log(`DATA_REQUEST_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("");
    console.log("# Hospital wallet addresses (for reference):");
    hospitals.forEach((h, i) => {
        console.log(`# ${h.id}: ${h.address}`);
    });
    console.log("═".repeat(60));

    // Save deployment info to file
    const fs = require("fs");
    const path = require("path");

    const deploymentInfo = {
        network: "ganache",
        contractAddress: contractAddress,
        deployedAt: new Date().toISOString(),
        admin: admin.address,
        hospitals: hospitals.map(h => ({
            id: h.id,
            name: h.name,
            address: h.address
        }))
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(deploymentsDir, "MedicalDataRequest-ganache.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n💾 Deployment info saved to: deployments/MedicalDataRequest-ganache.json");

    console.log("\n✨ Deployment complete! Ready for cross-hospital data requests.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
