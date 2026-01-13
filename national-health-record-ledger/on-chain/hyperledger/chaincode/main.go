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
	RecordID      string `json:"recordId"`      // Unique UUID
	PatientUID    string `json:"patientUid"`    // Pseudonymized ID
	HospitalID    string `json:"hospitalId"`    // Origin Hospital
	OffChainLoc   string `json:"offChainLoc"`   // URL/Pointer to off-chain DB
	DataHash      string `json:"dataHash"`      // SHA-256 for integrity check
	Description   string `json:"description"`   // e.g. "General Checkup"
	Timestamp     int64  `json:"timestamp"`
	IsDeleted     bool   `json:"isDeleted"`     // Soft Delete Flag
	AccessList    []string `json:"accessList"`  // List of HospitalIDs with access
}

// InitLedger adds a base set of data to the ledger
func (c *MedicalContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("National Health Ledger Initialized")
	return nil
}

// CreateMetadata adds a new record metadata
func (c *MedicalContract) CreateMetadata(ctx contractapi.TransactionContextInterface, recordId string, patientUid string, hospitalId string, location string, dataHash string, desc string) error {
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
		Timestamp:   time.Now().Unix(),
		IsDeleted:   false,
		AccessList:  []string{hospitalId},
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordId, metadataJSON)
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

	if metadata.IsDeleted {
		return nil, fmt.Errorf("record %s has been deleted", recordId)
	}

	return &metadata, nil
}

// SoftDelete marks a record as deleted (Right to Erasure compliance support)
func (c *MedicalContract) SoftDelete(ctx contractapi.TransactionContextInterface, recordId string) error {
	metadata, err := c.ReadMetadata(ctx, recordId)
	if err != nil {
		return err
	}

	metadata.IsDeleted = true

	// We overwrite the state with IsDeleted=true.
	// We DO NOT delete the state key entirely to maintain Audit Trail of the deletion.
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
func (c *MedicalContract) GrantAccess(ctx contractapi.TransactionContextInterface, recordId string, targetHospitalId string) error {
	metadata, err := c.ReadMetadata(ctx, recordId)
	if err != nil {
		return err
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

func main() {
	chaincode, err := contractapi.NewChaincode(&MedicalContract{})
	if err != nil {
		fmt.Printf("Error creating medical chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting medical chaincode: %s", err.Error())
	}
}
