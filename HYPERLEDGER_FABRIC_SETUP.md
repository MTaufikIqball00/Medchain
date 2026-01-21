# 🏥 Hyperledger Fabric Setup untuk MedChain

## Prerequisites
- **OS**: Windows 10/11 atau Linux/macOS
- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **Node.js**: >= 14.0
- **Git**: >= 2.0

---

## 📋 Phase 1: Instalasi Hyperledger Fabric Tools

### 1.1 Download Fabric Binaries & Docker Images
```bash
# Clone fabric-samples repository (contains test-network)
cd D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\national-health-record-ledger
git clone https://github.com/hyperledger/fabric-samples.git

cd fabric-samples

# Download fabric binaries (peer, orderer, fabric-ca, etc)
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
# Atau untuk Windows (PowerShell):
# Invoke-WebRequest -Uri "https://bit.ly/2ysbOFE" -OutFile script.sh
# bash script.sh 2.5.0

# Add binaries to PATH
# Windows: 
# - Tambahkan ke Environment Variables: D:\path\to\fabric-samples\bin
# - Atau: $env:PATH += ";D:\UNIKOM\Semester 7\Blockchain\New folder\Medchain\fabric-samples\bin"
```

### 1.2 Verifikasi Instalasi
```bash
# Check versions
peer version
orderer version
fabric-ca-client version
```

---

## 🔧 Phase 2: Setup Test Network untuk Medical Records

### 2.1 Navigate ke Test Network
```bash
cd fabric-samples/test-network
```

### 2.2 Cleanup (jika ada network sebelumnya)
```bash
# MacOS/Linux
./network.sh down
rm -rf organizations/

# Windows (PowerShell)
./network.sh down
Remove-Item -Recurse -Force organizations/
```

### 2.3 Start Network dengan 2 Org
```bash
# Start Orderer + Org1 + Org2 + CA
./network.sh up createChannel -c medchannel

# Verify network is running
docker ps
# Anda akan melihat:
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - fabric-ca (org1, org2)
```

---

## 📝 Phase 3: Deploy Medical Records Chaincode

### 3.1 Setup Chaincode Directory
```bash
# Navigate to chaincode directory
cd fabric-samples/test-network

# Copy atau buat chaincode baru untuk medical records
# Pilihan 1: Copy dari existing (jika ada)
cp -r ../chaincode-go/fabcar medchannel-medrecords

# Pilihan 2: Buat baru (lihat template di bawah)
mkdir medchannel-medrecords
# Buat file di ./medchannel-medrecords/medrecords.go
```

### 3.2 Kontrak Chaincode Go (Template)
**File:** `fabric-samples/test-network/medchannel-medrecords/medrecords.go`

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing medical records
type SmartContract struct {
	contractapi.Contract
}

// MedicalRecord structure
type MedicalRecord struct {
	RecordID    string `json:"recordId"`
	PatientName string `json:"patientName"`
	PatientID   string `json:"patientId"`
	Diagnosis   string `json:"diagnosis"`
	Treatment   string `json:"treatment"`
	Symptoms    string `json:"symptoms"`
	Department  string `json:"department"`
	DoctorName  string `json:"doctorName"`
	Timestamp   int64  `json:"timestamp"`
	DataHash    string `json:"dataHash"`
	IsEncrypted bool   `json:"isEncrypted"`
}

// InitLedger adds sample medical records to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	records := []MedicalRecord{
		{
			RecordID:    "MED-001",
			PatientName: "Patient One",
			PatientID:   "P001",
			Diagnosis:   "Common Cold",
			Treatment:   "Rest and fluids",
			Symptoms:    "Cough, fever",
			Department:  "General",
			DoctorName:  "Dr. John",
			Timestamp:   1000,
			DataHash:    "hash1",
			IsEncrypted: false,
		},
	}

	for _, record := range records {
		recordJSON, err := json.Marshal(record)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(record.RecordID, recordJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state. %v", err)
		}
	}
	return nil
}

// CreateRecord adds a new medical record to the world state
func (s *SmartContract) CreateRecord(ctx contractapi.TransactionContextInterface, 
	recordID string, patientName string, patientID string, diagnosis string,
	treatment string, symptoms string, department string, doctorName string,
	dataHash string) error {

	exists, err := s.RecordExists(ctx, recordID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the asset %s already exists", recordID)
	}

	record := MedicalRecord{
		RecordID:    recordID,
		PatientName: patientName,
		PatientID:   patientID,
		Diagnosis:   diagnosis,
		Treatment:   treatment,
		Symptoms:    symptoms,
		Department:  department,
		DoctorName:  doctorName,
		Timestamp:   ctx.GetStub().GetTxTimestamp().Seconds,
		DataHash:    dataHash,
		IsEncrypted: false,
	}
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

// ReadRecord returns the medical record stored in the world state
func (s *SmartContract) ReadRecord(ctx contractapi.TransactionContextInterface, recordID string) (*MedicalRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("the asset %s does not exist", recordID)
	}

	var record MedicalRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// GetAllRecords returns all medical records found in world state
func (s *SmartContract) GetAllRecords(ctx contractapi.TransactionContextInterface) ([]*MedicalRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*MedicalRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record MedicalRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

// QueryByPatientID returns all medical records for a patient
func (s *SmartContract) QueryByPatientID(ctx contractapi.TransactionContextInterface, patientID string) ([]*MedicalRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResultsForQueryString(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*MedicalRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record MedicalRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

// RecordExists returns true when asset with given ID exists in world state
func (s *SmartContract) RecordExists(ctx contractapi.TransactionContextInterface, recordID string) (bool, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return recordJSON != nil, nil
}

// UpdateRecord updates an existing medical record
func (s *SmartContract) UpdateRecord(ctx contractapi.TransactionContextInterface,
	recordID string, patientName string, patientID string, diagnosis string,
	treatment string, symptoms string, department string, doctorName string,
	dataHash string) error {

	exists, err := s.RecordExists(ctx, recordID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the asset %s does not exist", recordID)
	}

	// Get existing record to preserve timestamp
	existing, err := s.ReadRecord(ctx, recordID)
	if err != nil {
		return err
	}

	record := MedicalRecord{
		RecordID:    recordID,
		PatientName: patientName,
		PatientID:   patientID,
		Diagnosis:   diagnosis,
		Treatment:   treatment,
		Symptoms:    symptoms,
		Department:  department,
		DoctorName:  doctorName,
		Timestamp:   existing.Timestamp,
		DataHash:    dataHash,
		IsEncrypted: existing.IsEncrypted,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

// DeleteRecord removes a medical record from the world state
func (s *SmartContract) DeleteRecord(ctx contractapi.TransactionContextInterface, recordID string) error {
	exists, err := s.RecordExists(ctx, recordID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the asset %s does not exist", recordID)
	}

	return ctx.GetStub().DelState(recordID)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}
}
```

### 3.3 Go Module File
**File:** `fabric-samples/test-network/medchannel-medrecords/go.mod`

```
module github.com/hyperledger/fabric-samples/medchannel-medrecords

go 1.19

require github.com/hyperledger/fabric-contract-api-go v1.2.0
```

### 3.4 Deploy Chaincode
```bash
cd fabric-samples/test-network

# Set environment variables
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CHANNEL_NAME=medchannel
export CC_NAME=medrecords
export CC_SRC_PATH=./medchannel-medrecords
export CC_RUNTIME_LANGUAGE=go
export CC_VERSION=1.0
export CC_SEQUENCE=1

# Package chaincode
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CC_SRC_PATH} \
  --lang ${CC_RUNTIME_LANGUAGE} \
  --label ${CC_NAME}_${CC_VERSION}

# Install on Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Get package ID (save it)
export CC_PACKAGE_ID=medrecords_1.0:xxxxxxxxxxxxx (copy from output)

# Approve chaincode on Org1
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -v ${CC_VERSION} \
  --package-id ${CC_PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --waitForEvent

# Approve on Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -v ${CC_VERSION} \
  --package-id ${CC_PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --waitForEvent

# Commit chaincode
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode commit \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -v ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  --waitForEvent

# Invoke InitLedger to populate sample data
peer chaincode invoke \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -c '{"function":"InitLedger","Args":[]}' \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```

---

## 🌐 Phase 4: Setup REST API Gateway

### 4.1 Fabric Node SDK Setup
**File:** `national-health-record-ledger/off-chain/api-gateway/fabric-client-config.js`

```javascript
module.exports = {
  enrollmentID: 'appUser',
  enrollmentSecret: 'appUserpw',
  mspID: 'Org1MSP',
  caURL: 'http://localhost:7054',
  peerURL: 'grpc://localhost:7051',
  eventURL: 'grpc://localhost:7051',
  ordererURL: 'grpc://localhost:7050',
  channelID: 'medchannel',
  chaincodeName: 'medrecords',
  walletPath: './wallet',
  connectionProfile: './connection-org1.json'
};
```

### 4.2 Install Dependencies
```bash
cd national-health-record-ledger/off-chain/api-gateway

npm install fabric-ca-client fabric-client
```

### 4.3 Create Fabric Client Service
**File:** `fabric-client.js` (sudah akan dibuat di phase berikutnya)

---

## ✅ Verification Checklist

- [ ] Docker daemon running
- [ ] Hyperledger Fabric binaries in PATH
- [ ] Test network up (`docker ps` shows 5+ containers)
- [ ] Chaincode installed on both orgs
- [ ] Chaincode committed to channel
- [ ] InitLedger invoked successfully
- [ ] API Gateway can connect to peer

---

## 🔗 Useful Commands

```bash
# Check network status
docker ps

# Check logs
docker logs orderer.example.com
docker logs peer0.org1.example.com
docker logs peer0.org2.example.com

# Query chaincode
peer chaincode query \
  -C medchannel \
  -n medrecords \
  -c '{"function":"GetAllRecords","Args":[]}'

# Get transaction history
peer chaincode invoke \
  -C medchannel \
  -n medrecords \
  -c '{"function":"ReadRecord","Args":["MED-001"]}'

# Stop network
cd fabric-samples/test-network
./network.sh down
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker containers won't start | `docker-compose up -d` atau restart Docker daemon |
| Peer tidak connect | Check firewall, verify ports 7051, 7052, 7053 |
| Chaincode invoke fails | Verify environment variables, check peer logs |
| Transaction timeout | Increase timeout di config atau reduce network load |

---

Lanjutkan ke **Phase 5** setelah setup berhasil!
