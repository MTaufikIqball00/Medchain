/**
 * Fabric Client Service
 * Handles communication with Hyperledger Fabric network
 */

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class FabricClient {
  constructor(config) {
    this.config = config;
    this.gateway = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  /**
   * Initialize the Fabric Gateway
   */
  async initialize() {
    try {
      // Create a new gateway
      this.gateway = new Gateway();

      // Use connectionProfile from config
      const connectionProfile = require(this.config.connectionProfile);

      // Connect to gateway
      await this.gateway.connect(connectionProfile, {
        wallet: this.wallet,
        identity: this.config.enrollmentID,
        discovery: { enabled: true, asLocalhost: true }
      });

      console.log('Connected to Fabric Gateway');

      // Get network and contract
      const network = await this.gateway.getNetwork(this.config.channelID);
      this.contract = network.getContract(this.config.chaincodeName);

      this.initialized = true;
      console.log('Fabric Client initialized');
    } catch (error) {
      console.error('Failed to initialize Fabric client:', error);
      throw error;
    }
  }

  /**
   * Enroll user with CA
   */
  async enrollUser() {
    try {
      // Check if user already enrolled
      const userExists = await this.wallet.exists(this.config.enrollmentID);
      if (userExists) {
        console.log(`User ${this.config.enrollmentID} already enrolled`);
        return;
      }

      // Enroll user
      const caClient = new FabricCAServices(this.config.caURL);
      const enrollment = await caClient.enroll({
        enrollmentID: this.config.enrollmentID,
        enrollmentSecret: this.config.enrollmentSecret
      });

      // Create identity
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes()
        },
        mspId: this.config.mspID,
        type: 'X.509'
      };

      // Store in wallet
      await this.wallet.import(this.config.enrollmentID, x509Identity);
      console.log(`User ${this.config.enrollmentID} enrolled and stored in wallet`);
    } catch (error) {
      console.error('Enrollment failed:', error);
      throw error;
    }
  }

  /**
   * Create Medical Record
   */
  async createRecord(recordData) {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.submitTransaction(
        'CreateRecord',
        recordData.recordId,
        recordData.patientName,
        recordData.patientId,
        recordData.diagnosis,
        recordData.treatment,
        recordData.symptoms,
        recordData.department || '',
        recordData.doctorName,
        recordData.dataHash
      );

      const txID = result.toString();
      console.log(`Transaction ID: ${txID}`);

      return {
        success: true,
        transactionId: txID,
        recordId: recordData.recordId
      };
    } catch (error) {
      console.error('Failed to create record:', error);
      throw error;
    }
  }

  /**
   * Read Medical Record
   */
  async readRecord(recordId) {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.evaluateTransaction('ReadRecord', recordId);
      const record = JSON.parse(result.toString());

      return {
        success: true,
        data: record
      };
    } catch (error) {
      console.error(`Failed to read record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Get All Records
   */
  async getAllRecords() {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.evaluateTransaction('GetAllRecords');
      const records = JSON.parse(result.toString());

      return {
        success: true,
        count: records.length,
        data: records
      };
    } catch (error) {
      console.error('Failed to get all records:', error);
      throw error;
    }
  }

  /**
   * Query Records by Patient ID
   */
  async queryByPatientID(patientId) {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.evaluateTransaction('QueryByPatientID', patientId);
      const records = JSON.parse(result.toString());

      return {
        success: true,
        count: records.length,
        data: records
      };
    } catch (error) {
      console.error(`Failed to query records for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Update Record
   */
  async updateRecord(recordData) {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.submitTransaction(
        'UpdateRecord',
        recordData.recordId,
        recordData.patientName,
        recordData.patientId,
        recordData.diagnosis,
        recordData.treatment,
        recordData.symptoms,
        recordData.department || '',
        recordData.doctorName,
        recordData.dataHash
      );

      const txID = result.toString();
      console.log(`Update Transaction ID: ${txID}`);

      return {
        success: true,
        transactionId: txID,
        recordId: recordData.recordId
      };
    } catch (error) {
      console.error('Failed to update record:', error);
      throw error;
    }
  }

  /**
   * Delete Record
   */
  async deleteRecord(recordId) {
    try {
      if (!this.initialized) await this.initialize();

      const result = await this.contract.submitTransaction('DeleteRecord', recordId);
      const txID = result.toString();

      console.log(`Delete Transaction ID: ${txID}`);

      return {
        success: true,
        transactionId: txID,
        recordId: recordId
      };
    } catch (error) {
      console.error(`Failed to delete record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Get Transaction History (dari ledger)
   */
  async getTransactionHistory(recordId) {
    try {
      if (!this.initialized) await this.initialize();

      // Query the chaincode history
      const result = await this.contract.evaluateTransaction('GetTransactionHistory', recordId);
      const history = JSON.parse(result.toString());

      return {
        success: true,
        count: history.length,
        data: history
      };
    } catch (error) {
      console.error(`Failed to get transaction history for ${recordId}:`, error);
      // Fallback: return empty history jika function tidak ada
      return {
        success: false,
        count: 0,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Close Gateway Connection
   */
  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
      console.log('Disconnected from Fabric Gateway');
    }
  }
}

module.exports = FabricClient;
