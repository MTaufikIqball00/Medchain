const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MedicalDataRequest", function () {
    let contract;
    let admin, hospitalA, hospitalB, hospitalC, unauthorized;

    const testPatientUID = ethers.keccak256(ethers.toUtf8Bytes("PAT-123456-PSEUDONYMIZED"));
    const testDataHash = ethers.keccak256(ethers.toUtf8Bytes("encrypted-medical-data-hash"));

    beforeEach(async function () {
        [admin, hospitalA, hospitalB, hospitalC, unauthorized] = await ethers.getSigners();

        const MedicalDataRequest = await ethers.getContractFactory("MedicalDataRequest");
        contract = await MedicalDataRequest.deploy();
        await contract.waitForDeployment();

        // Register hospitals
        await contract.registerHospital(hospitalA.address, "RS-A", "Rumah Sakit A");
        await contract.registerHospital(hospitalB.address, "RS-B", "Rumah Sakit B");
        await contract.registerHospital(hospitalC.address, "RS-C", "Rumah Sakit C");
    });

    describe("Hospital Registration", function () {
        it("Should register a hospital by admin", async function () {
            const info = await contract.getHospitalInfo(hospitalA.address);
            expect(info.hospitalId).to.equal("RS-A");
            expect(info.name).to.equal("Rumah Sakit A");
            expect(info.isRegistered).to.be.true;
        });

        it("Should fail if non-admin tries to register hospital", async function () {
            await expect(
                contract.connect(hospitalA).registerHospital(unauthorized.address, "RS-X", "Hospital X")
            ).to.be.revertedWith("Only admin can perform this action");
        });

        it("Should fail if hospital already registered", async function () {
            await expect(
                contract.registerHospital(hospitalA.address, "RS-A-2", "Duplicate")
            ).to.be.revertedWith("Hospital already registered");
        });

        it("Should emit HospitalRegistered event", async function () {
            await expect(contract.registerHospital(unauthorized.address, "RS-NEW", "New Hospital"))
                .to.emit(contract, "HospitalRegistered");
        });

        it("Should return correct hospital count", async function () {
            expect(await contract.getHospitalCount()).to.equal(3);
        });
    });

    describe("Data Request Creation", function () {
        it("Should create a data request successfully", async function () {
            const requestId = "REQ-001";

            await contract.connect(hospitalA).requestPatientData(
                requestId,
                hospitalB.address,
                testPatientUID,
                "Specialist referral"
            );

            const request = await contract.getRequest(requestId);
            expect(request.requestingHospital).to.equal(hospitalA.address);
            expect(request.targetHospital).to.equal(hospitalB.address);
            expect(request.patientUID).to.equal(testPatientUID);
            expect(request.status).to.equal(0); // PENDING
        });

        it("Should emit DataRequestCreated event", async function () {
            await expect(
                contract.connect(hospitalA).requestPatientData(
                    "REQ-002",
                    hospitalB.address,
                    testPatientUID,
                    "Emergency transfer"
                )
            ).to.emit(contract, "DataRequestCreated");
        });

        it("Should fail if unregistered hospital tries to request", async function () {
            await expect(
                contract.connect(unauthorized).requestPatientData(
                    "REQ-003",
                    hospitalB.address,
                    testPatientUID,
                    "Invalid request"
                )
            ).to.be.revertedWith("Only registered hospitals can perform this action");
        });

        it("Should fail if requesting from self", async function () {
            await expect(
                contract.connect(hospitalA).requestPatientData(
                    "REQ-004",
                    hospitalA.address,
                    testPatientUID,
                    "Self request"
                )
            ).to.be.revertedWith("Cannot request data from yourself");
        });

        it("Should fail if request ID already exists", async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-005",
                hospitalB.address,
                testPatientUID,
                "First request"
            );

            await expect(
                contract.connect(hospitalA).requestPatientData(
                    "REQ-005",
                    hospitalC.address,
                    testPatientUID,
                    "Duplicate ID"
                )
            ).to.be.revertedWith("Request ID already exists");
        });

        it("Should fail with empty purpose", async function () {
            await expect(
                contract.connect(hospitalA).requestPatientData(
                    "REQ-006",
                    hospitalB.address,
                    testPatientUID,
                    ""
                )
            ).to.be.revertedWith("Purpose cannot be empty");
        });

        it("Should increment pending requests count", async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-007",
                hospitalB.address,
                testPatientUID,
                "Test request"
            );

            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(1);
        });
    });

    describe("Request Approval", function () {
        beforeEach(async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-APPROVE-001",
                hospitalB.address,
                testPatientUID,
                "Approval test"
            );
        });

        it("Should approve request successfully", async function () {
            await contract.connect(hospitalB).approveRequest("REQ-APPROVE-001");

            const status = await contract.getRequestStatus("REQ-APPROVE-001");
            expect(status).to.equal(1); // APPROVED
        });

        it("Should set expiration time to 24 hours after approval", async function () {
            await contract.connect(hospitalB).approveRequest("REQ-APPROVE-001");

            const request = await contract.getRequest("REQ-APPROVE-001");
            const expectedExpiry = BigInt(request.approvedAt) + BigInt(24 * 60 * 60);
            expect(request.expiresAt).to.equal(expectedExpiry);
        });

        it("Should emit RequestApproved event", async function () {
            await expect(contract.connect(hospitalB).approveRequest("REQ-APPROVE-001"))
                .to.emit(contract, "RequestApproved");
        });

        it("Should fail if non-target hospital tries to approve", async function () {
            await expect(
                contract.connect(hospitalC).approveRequest("REQ-APPROVE-001")
            ).to.be.revertedWith("Only target hospital can perform this action");
        });

        it("Should fail if request is not pending", async function () {
            await contract.connect(hospitalB).approveRequest("REQ-APPROVE-001");

            await expect(
                contract.connect(hospitalB).approveRequest("REQ-APPROVE-001")
            ).to.be.revertedWith("Request is not pending");
        });

        it("Should remove from pending list after approval", async function () {
            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(1);

            await contract.connect(hospitalB).approveRequest("REQ-APPROVE-001");

            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(0);
        });

        it("Should return true for isAccessActive after approval", async function () {
            await contract.connect(hospitalB).approveRequest("REQ-APPROVE-001");

            expect(await contract.isAccessActive("REQ-APPROVE-001")).to.be.true;
        });
    });

    describe("Request Rejection", function () {
        beforeEach(async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-REJECT-001",
                hospitalB.address,
                testPatientUID,
                "Rejection test"
            );
        });

        it("Should reject request successfully", async function () {
            await contract.connect(hospitalB).rejectRequest("REQ-REJECT-001");

            const status = await contract.getRequestStatus("REQ-REJECT-001");
            expect(status).to.equal(2); // REJECTED
        });

        it("Should emit RequestRejected event", async function () {
            await expect(contract.connect(hospitalB).rejectRequest("REQ-REJECT-001"))
                .to.emit(contract, "RequestRejected");
        });

        it("Should fail if non-target hospital tries to reject", async function () {
            await expect(
                contract.connect(hospitalC).rejectRequest("REQ-REJECT-001")
            ).to.be.revertedWith("Only target hospital can perform this action");
        });
    });

    describe("Data Hash Anchoring", function () {
        beforeEach(async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-ANCHOR-001",
                hospitalB.address,
                testPatientUID,
                "Anchor test"
            );
            await contract.connect(hospitalB).approveRequest("REQ-ANCHOR-001");
        });

        it("Should anchor data hash successfully", async function () {
            await contract.connect(hospitalB).anchorDataHash("REQ-ANCHOR-001", testDataHash);

            const request = await contract.getRequest("REQ-ANCHOR-001");
            expect(request.dataHash).to.equal(testDataHash);
        });

        it("Should emit DataHashAnchored event", async function () {
            await expect(
                contract.connect(hospitalB).anchorDataHash("REQ-ANCHOR-001", testDataHash)
            ).to.emit(contract, "DataHashAnchored");
        });

        it("Should fail if request is not approved", async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-ANCHOR-002",
                hospitalB.address,
                testPatientUID,
                "Unapproved anchor test"
            );

            await expect(
                contract.connect(hospitalB).anchorDataHash("REQ-ANCHOR-002", testDataHash)
            ).to.be.revertedWith("Request is not approved");
        });
    });

    describe("Expiration Logic", function () {
        beforeEach(async function () {
            await contract.connect(hospitalA).requestPatientData(
                "REQ-EXPIRE-001",
                hospitalB.address,
                testPatientUID,
                "Expiration test"
            );
            await contract.connect(hospitalB).approveRequest("REQ-EXPIRE-001");
        });

        it("Should return EXPIRED status after 24 hours", async function () {
            // Fast forward 25 hours
            await time.increase(25 * 60 * 60);

            const status = await contract.getRequestStatus("REQ-EXPIRE-001");
            expect(status).to.equal(3); // EXPIRED
        });

        it("Should return false for isAccessActive after expiration", async function () {
            await time.increase(25 * 60 * 60);

            expect(await contract.isAccessActive("REQ-EXPIRE-001")).to.be.false;
        });

        it("Should fail to anchor data hash after expiration", async function () {
            await time.increase(25 * 60 * 60);

            await expect(
                contract.connect(hospitalB).anchorDataHash("REQ-EXPIRE-001", testDataHash)
            ).to.be.revertedWith("Access has expired");
        });

        it("Should still be active just before 24 hours", async function () {
            await time.increase(23 * 60 * 60 + 59 * 60); // 23 hours 59 minutes

            expect(await contract.isAccessActive("REQ-EXPIRE-001")).to.be.true;
        });
    });

    describe("Rate Limiting", function () {
        it("Should allow up to 10 requests per hour", async function () {
            for (let i = 0; i < 10; i++) {
                await contract.connect(hospitalA).requestPatientData(
                    `REQ-RATE-${i}`,
                    hospitalB.address,
                    testPatientUID,
                    `Rate limit test ${i}`
                );
            }

            expect(await contract.getTotalRequestCount()).to.equal(10);
        });

        it("Should reject 11th request within same hour", async function () {
            for (let i = 0; i < 10; i++) {
                await contract.connect(hospitalA).requestPatientData(
                    `REQ-RATE-LIMIT-${i}`,
                    hospitalB.address,
                    testPatientUID,
                    `Rate limit test ${i}`
                );
            }

            await expect(
                contract.connect(hospitalA).requestPatientData(
                    "REQ-RATE-LIMIT-11",
                    hospitalB.address,
                    testPatientUID,
                    "Should fail"
                )
            ).to.be.revertedWith("Rate limit exceeded: max 10 requests per hour");
        });

        it("Should reset rate limit after 1 hour", async function () {
            for (let i = 0; i < 10; i++) {
                await contract.connect(hospitalA).requestPatientData(
                    `REQ-RATE-RESET-${i}`,
                    hospitalB.address,
                    testPatientUID,
                    `Rate limit test ${i}`
                );
            }

            // Fast forward 1 hour
            await time.increase(60 * 60 + 1);

            // Should work now
            await contract.connect(hospitalA).requestPatientData(
                "REQ-RATE-RESET-AFTER",
                hospitalB.address,
                testPatientUID,
                "After reset"
            );

            expect(await contract.getRemainingRateLimit(hospitalA.address)).to.equal(9);
        });

        it("Should return correct remaining rate limit", async function () {
            expect(await contract.getRemainingRateLimit(hospitalA.address)).to.equal(10);

            await contract.connect(hospitalA).requestPatientData(
                "REQ-CHECK-LIMIT",
                hospitalB.address,
                testPatientUID,
                "Check limit"
            );

            expect(await contract.getRemainingRateLimit(hospitalA.address)).to.equal(9);
        });
    });

    describe("Full Cross-Hospital Flow", function () {
        it("Complete scenario: RS-A requests data from RS-B, RS-B approves", async function () {
            const requestId = "REQ-FULL-FLOW-001";

            // 1. RS-A creates request
            await contract.connect(hospitalA).requestPatientData(
                requestId,
                hospitalB.address,
                testPatientUID,
                "Specialist referral - cardiology consultation"
            );
            expect(await contract.getRequestStatus(requestId)).to.equal(0); // PENDING

            // 2. Check pending at RS-B
            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(1);

            // 3. RS-B approves
            await contract.connect(hospitalB).approveRequest(requestId);
            expect(await contract.getRequestStatus(requestId)).to.equal(1); // APPROVED
            expect(await contract.isAccessActive(requestId)).to.be.true;

            // 4. RS-B anchors data hash
            await contract.connect(hospitalB).anchorDataHash(requestId, testDataHash);

            // 5. Verify complete request
            const request = await contract.getRequest(requestId);
            expect(request.dataHash).to.equal(testDataHash);
            expect(request.expiresAt).to.be.gt(request.approvedAt);
        });

        it("Complete scenario: RS-A requests, RS-B rejects", async function () {
            const requestId = "REQ-FULL-REJECT-001";

            await contract.connect(hospitalA).requestPatientData(
                requestId,
                hospitalB.address,
                testPatientUID,
                "Request that will be rejected"
            );

            await contract.connect(hospitalB).rejectRequest(requestId);

            expect(await contract.getRequestStatus(requestId)).to.equal(2); // REJECTED
            expect(await contract.isAccessActive(requestId)).to.be.false;
        });

        it("Parallel requests from multiple hospitals", async function () {
            // RS-A requests from RS-B
            await contract.connect(hospitalA).requestPatientData(
                "REQ-PARALLEL-A",
                hospitalB.address,
                testPatientUID,
                "From A to B"
            );

            // RS-C also requests from RS-B
            await contract.connect(hospitalC).requestPatientData(
                "REQ-PARALLEL-C",
                hospitalB.address,
                testPatientUID,
                "From C to B"
            );

            // RS-B should have 2 pending requests
            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(2);

            // RS-B approves A, rejects C
            await contract.connect(hospitalB).approveRequest("REQ-PARALLEL-A");
            await contract.connect(hospitalB).rejectRequest("REQ-PARALLEL-C");

            expect(await contract.getRequestStatus("REQ-PARALLEL-A")).to.equal(1); // APPROVED
            expect(await contract.getRequestStatus("REQ-PARALLEL-C")).to.equal(2); // REJECTED
            expect(await contract.getPendingRequestsCount(hospitalB.address)).to.equal(0);
        });
    });
});
