package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// MedicalContract contract for managing metadata
type MedicalContract struct {
	contractapi.Contract
}

// MedicalMetadata represents the data stored on Fabric (NO PII)
type MedicalMetadata struct {
	RecordID    string   `json:"recordId"`    // Unique UUID
	PatientUID  string   `json:"patientUid"`  // Pseudonymized ID
	HospitalID  string   `json:"hospitalId"`  // Origin Hospital
	OffChainLoc string   `json:"offChainLoc"` // URL/Pointer to off-chain DB
	DataHash    string   `json:"dataHash"`    // SHA-256 for integrity check
	Description string   `json:"description"` // e.g. "General Checkup"
	Timestamp   int64    `json:"timestamp"`   // Deterministic Unix timestamp from transaction
	IsDeleted   bool     `json:"isDeleted"`   // Soft Delete Flag
	AccessList  []string `json:"accessList"`  // List of HospitalIDs with access
}

// HistoryRecord represents a historical state modification
type HistoryRecord struct {
	TxId      string           `json:"txId"`
	Timestamp int64            `json:"timestamp"`
	IsDelete  bool             `json:"isDelete"`
	Record    *MedicalMetadata `json:"record"`
}

// InitLedger adds a base set of data to the ledger
func (c *MedicalContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("National Health Ledger Initialized")
	return nil
}

// getTxTimestampSec gets deterministic Unix timestamp from transaction header
func getTxTimestampSec(ctx contractapi.TransactionContextInterface) int64 {
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil || txTimestamp == nil {
		return time.Now().Unix() // fallback
	}
	return txTimestamp.GetSeconds()
}

// CreateMetadata adds a new record metadata (full parameter version)
func (c *MedicalContract) CreateMetadata(ctx contractapi.TransactionContextInterface, recordId string, patientUid string, hospitalId string, location string, dataHash string, desc string) error {
	if recordId == "" || patientUid == "" || hospitalId == "" || dataHash == "" {
		return fmt.Errorf("recordId, patientUid, hospitalId, and dataHash are required")
	}

	exists, err := c.MetadataExists(ctx, recordId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the metadata %s already exists", recordId)
	}

	metadata := MedicalMetadata{
		RecordID:    recordId,
		PatientUID:  patientUid,
		HospitalID:  hospitalId,
		OffChainLoc: location,
		DataHash:    dataHash,
		Description: desc,
		Timestamp:   getTxTimestampSec(ctx),
		IsDeleted:   false,
		AccessList:  []string{hospitalId},
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordId, metadataJSON)
}

// CreateRecord adds a new record metadata (simplified parameter version matching gateway)
func (c *MedicalContract) CreateRecord(ctx contractapi.TransactionContextInterface, recordId string, patientUid string, hospitalId string, dataHash string) error {
	return c.CreateMetadata(ctx, recordId, patientUid, hospitalId, "POSTGRESQL_OFFCHAIN", dataHash, "Medical Record")
}

// ReadMetadata returns the metadata stored in the world state with id
func (c *MedicalContract) ReadMetadata(ctx contractapi.TransactionContextInterface, recordId string) (*MedicalMetadata, error) {
	metadataJSON, err := ctx.GetStub().GetState(recordId)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if metadataJSON == nil {
		return nil, fmt.Errorf("the metadata %s does not exist", recordId)
	}

	var metadata MedicalMetadata
	err = json.Unmarshal(metadataJSON, &metadata)
	if err != nil {
		return nil, err
	}

	return &metadata, nil
}

// SoftDelete marks a record as deleted (Right to Erasure compliance support)
func (c *MedicalContract) SoftDelete(ctx contractapi.TransactionContextInterface, recordId string, requestingHospitalId string) error {
	metadata, err := c.ReadMetadata(ctx, recordId)
	if err != nil {
		return err
	}

	// Access control check: Only origin hospital can soft delete
	if metadata.HospitalID != requestingHospitalId {
		return fmt.Errorf("unauthorized: only owner hospital %s can soft delete record %s", metadata.HospitalID, recordId)
	}

	metadata.IsDeleted = true

	// Overwrite state with IsDeleted=true to maintain Audit Trail
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordId, metadataJSON)
}

// MetadataExists returns true when metadata with given ID exists in world state
func (c *MedicalContract) MetadataExists(ctx contractapi.TransactionContextInterface, recordId string) (bool, error) {
	metadataJSON, err := ctx.GetStub().GetState(recordId)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return metadataJSON != nil, nil
}

// GrantAccess adds a hospital ID to the access list
func (c *MedicalContract) GrantAccess(ctx contractapi.TransactionContextInterface, recordId string, granterHospitalId string, targetHospitalId string) error {
	metadata, err := c.ReadMetadata(ctx, recordId)
	if err != nil {
		return err
	}

	// Access control check: Only owner hospital can grant access
	if metadata.HospitalID != granterHospitalId {
		return fmt.Errorf("unauthorized: only owner hospital %s can grant access to record %s", metadata.HospitalID, recordId)
	}

	// Check if already has access
	for _, h := range metadata.AccessList {
		if h == targetHospitalId {
			return nil
		}
	}

	metadata.AccessList = append(metadata.AccessList, targetHospitalId)
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordId, metadataJSON)
}

// GetTransactionHistory retrieves history for a specific record
func (c *MedicalContract) GetTransactionHistory(ctx contractapi.TransactionContextInterface, recordId string) ([]HistoryRecord, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(recordId)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var history []HistoryRecord
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record MedicalMetadata
		if len(response.Value) > 0 {
			if err := json.Unmarshal(response.Value, &record); err != nil {
				return nil, err
			}
		}

		history = append(history, HistoryRecord{
			TxId:      response.TxId,
			Timestamp: response.Timestamp.GetSeconds(),
			IsDelete:  response.IsDelete,
			Record:    &record,
		})
	}

	return history, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&MedicalContract{})
	if err != nil {
		fmt.Printf("Error creating medical chaincode: %s\n", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting medical chaincode: %s\n", err.Error())
	}
}
