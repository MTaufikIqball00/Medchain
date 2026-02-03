const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying MedicalAnchor contract...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    const MedicalAnchor = await hre.ethers.getContractFactory("MedicalAnchor");
    const contract = await MedicalAnchor.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("✅ MedicalAnchor deployed to:", contractAddress);
    console.log("👤 Admin (contract owner):", deployer.address);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        adminAddress: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber()
    };

    // Write to deployment file
    const deploymentPath = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
        path.join(deploymentPath, `${hre.network.name}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📄 Deployment info saved to:", `deployments/${hre.network.name}.json`);

    // Print .env configuration
    console.log("\n" + "=".repeat(50));
    console.log("📝 Add the following to your .env file:");
    console.log("=".repeat(50));
    console.log(`ETH_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`ETH_ADMIN_ADDRESS=${deployer.address}`);
    console.log("=".repeat(50));

    // If on localhost, register some test hospitals
    if (hre.network.name === "localhost" || hre.network.name === "ganache") {
        console.log("\n🏥 Registering test hospitals...\n");

        const signers = await hre.ethers.getSigners();

        // Register Hospital A (signer 1)
        if (signers.length > 1) {
            await contract.registerHospital(
                signers[1].address,
                "RS-A",
                "Rumah Sakit A"
            );
            console.log("✅ Registered: Rumah Sakit A at", signers[1].address);
        }

        // Register Hospital B (signer 2)
        if (signers.length > 2) {
            await contract.registerHospital(
                signers[2].address,
                "RS-B",
                "Rumah Sakit B"
            );
            console.log("✅ Registered: Rumah Sakit B at", signers[2].address);
        }

        console.log("\n📋 Test Hospitals Registered:");
        console.log("   RS-A Address:", signers[1]?.address || "N/A");
        console.log("   RS-B Address:", signers[2]?.address || "N/A");
    }

    console.log("\n🎉 Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
