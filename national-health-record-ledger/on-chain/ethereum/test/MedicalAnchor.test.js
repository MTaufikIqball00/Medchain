const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalAnchor", function () {
    let contract;
    let admin, hospitalA, hospitalB, hospitalC;
    const testRecordId = "FABRIC_TX_123456789";
    const testDataHash = "sha256hashofmedicalrecorddata";

    beforeEach(async function () {
        [admin, hospitalA, hospitalB, hospitalC] = await ethers.getSigners();

        const MedicalAnchor = await ethers.getContractFactory("MedicalAnchor");
        contract = await MedicalAnchor.deploy();
        await contract.waitForDeployment();
    });

    describe("Hospital Registration", function () {
        it("Should register a hospital by admin", async function () {
            await contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A");

            const info = await contract.getHospitalInfo(hospitalA.address);
            expect(info.hospitalId).to.equal("RS-A");
            expect(info.name).to.equal("Rumah Sakit A");
            expect(info.isRegistered).to.be.true;
        });

        it("Should fail if non-admin tries to register hospital", async function () {
            await expect(
                contract.connect(hospitalA).registerHospital(hospitalB.address, "RS-B", "Hospital B")
            ).to.be.revertedWith("Only admin can perform this action");
        });

        it("Should emit HospitalRegistered event", async function () {
            await expect(contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A"))
                .to.emit(contract, "HospitalRegistered")
                .withArgs(hospitalA.address, "RS-A", "Rumah Sakit A", (await ethers.provider.getBlock("latest")).timestamp + 1);
        });
    });

    describe("Trust Anchor - Hash Anchoring", function () {
        beforeEach(async function () {
            await contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A");
        });

        it("Should anchor hash from registered hospital", async function () {
            await contract.connect(hospitalA).anchorHash(testRecordId, testDataHash);

            const proof = await contract.getProof(testRecordId);
            expect(proof.exists).to.be.true;
            expect(proof.hospitalNode).to.equal(hospitalA.address);
        });

        it("Should fail if unregistered address tries to anchor", async function () {
            await expect(
                contract.connect(hospitalB).anchorHash(testRecordId, testDataHash)
            ).to.be.revertedWith("Only registered hospitals can perform this action");
        });

        it("Should verify data integrity correctly", async function () {
            await contract.connect(hospitalA).anchorHash(testRecordId, testDataHash);

            const isValid = await contract.verifyIntegrity(testRecordId, testDataHash);
            expect(isValid).to.be.true;

            const isInvalid = await contract.verifyIntegrity(testRecordId, "tamperedhash");
            expect(isInvalid).to.be.false;
        });

        it("Should emit ProofAnchored event", async function () {
            await expect(contract.connect(hospitalA).anchorHash(testRecordId, testDataHash))
                .to.emit(contract, "ProofAnchored");
        });
    });

    describe("Access Control", function () {
        beforeEach(async function () {
            await contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A");
            await contract.registerHospital(hospitalB.address, "RS-B", "Rumah Sakit B");
            await contract.connect(hospitalA).anchorHash(testRecordId, testDataHash);
        });

        it("Record owner should automatically have access", async function () {
            const hasAccess = await contract.hasAccess(testRecordId, hospitalA.address);
            expect(hasAccess).to.be.true;
        });

        it("Other hospital should NOT have access initially", async function () {
            const hasAccess = await contract.hasAccess(testRecordId, hospitalB.address);
            expect(hasAccess).to.be.false;
        });

        it("Should allow requesting access", async function () {
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);

            const request = await contract.getAccessRequest(testRecordId, hospitalB.address);
            expect(request.pending).to.be.true;
            expect(request.approved).to.be.false;
        });

        it("Should emit AccessRequested event", async function () {
            await expect(contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address))
                .to.emit(contract, "AccessRequested")
                .withArgs(testRecordId, hospitalB.address, hospitalA.address, (await ethers.provider.getBlock("latest")).timestamp + 1);
        });

        it("Record owner should be able to grant access", async function () {
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);
            await contract.connect(hospitalA).grantAccess(testRecordId, hospitalB.address);

            const hasAccess = await contract.hasAccess(testRecordId, hospitalB.address);
            expect(hasAccess).to.be.true;

            const request = await contract.getAccessRequest(testRecordId, hospitalB.address);
            expect(request.approved).to.be.true;
            expect(request.pending).to.be.false;
        });

        it("Should emit AccessGranted event", async function () {
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);

            await expect(contract.connect(hospitalA).grantAccess(testRecordId, hospitalB.address))
                .to.emit(contract, "AccessGranted");
        });

        it("Record owner should be able to revoke access", async function () {
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);
            await contract.connect(hospitalA).grantAccess(testRecordId, hospitalB.address);

            await contract.connect(hospitalA).revokeAccess(testRecordId, hospitalB.address);

            const hasAccess = await contract.hasAccess(testRecordId, hospitalB.address);
            expect(hasAccess).to.be.false;
        });

        it("Non-owner should NOT be able to grant access", async function () {
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);

            await expect(
                contract.connect(hospitalB).grantAccess(testRecordId, hospitalB.address)
            ).to.be.revertedWith("Only record owner can perform this action");
        });
    });

    describe("Full Flow: Cross-Hospital Data Access", function () {
        it("Complete scenario: RS-A creates record, RS-B requests and gets access", async function () {
            // 1. Register hospitals
            await contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A");
            await contract.registerHospital(hospitalB.address, "RS-B", "Rumah Sakit B");

            // 2. RS-A creates record (anchors hash)
            await contract.connect(hospitalA).anchorHash(testRecordId, testDataHash);

            // 3. Verify RS-A has access, RS-B doesn't
            expect(await contract.hasAccess(testRecordId, hospitalA.address)).to.be.true;
            expect(await contract.hasAccess(testRecordId, hospitalB.address)).to.be.false;

            // 4. RS-B requests access
            await contract.connect(hospitalB).requestAccess(testRecordId, hospitalA.address);

            // 5. Verify request is pending
            const request = await contract.getAccessRequest(testRecordId, hospitalB.address);
            expect(request.pending).to.be.true;

            // 6. RS-A grants access
            await contract.connect(hospitalA).grantAccess(testRecordId, hospitalB.address);

            // 7. Verify RS-B now has access
            expect(await contract.hasAccess(testRecordId, hospitalB.address)).to.be.true;

            // 8. Both can verify integrity
            expect(await contract.connect(hospitalA).verifyIntegrity(testRecordId, testDataHash)).to.be.true;
            expect(await contract.connect(hospitalB).verifyIntegrity(testRecordId, testDataHash)).to.be.true;
        });
    });
});
