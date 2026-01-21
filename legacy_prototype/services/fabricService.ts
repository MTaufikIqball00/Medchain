import { MedicalRecordData } from "../types";

// API Gateway base URL - configure this based on your environment
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';
const FABRIC_API = `${API_BASE_URL}/fabric`;

export interface FabricTransaction {
  recordId: string;
  fabricTxId: string;
  timestamp: number;
  success: boolean;
}

export interface FabricRecord extends MedicalRecordData {
  fabricTxId?: string;
  version?: number;
  isDeleted?: boolean;
}

/**
 * Save medical record to Hyperledger Fabric
 * @param data Medical record data
 * @returns Transaction ID from Fabric network
 */
export const saveToHyperledgerFabric = async (data: MedicalRecordData): Promise<FabricTransaction> => {
    try {
        console.log("Submitting record to Hyperledger Fabric...");

        // Prepare record data
        const recordData = {
            recordId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientName: data.patientName,
            patientId: data.patientId,
            diagnosis: data.diagnosis,
            treatment: data.treatment,
            symptoms: data.symptoms,
            department: data.department || '',
            doctorName: data.doctorName,
            dataHash: generateHash(data),
            isEncrypted: data.isEncrypted || false
        };

        // Call REST API Gateway to submit to Fabric
        const response = await fetch(`${FABRIC_API}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();

        console.log(`[Fabric] Transaction committed: ${result.data.transactionId}`);

        return {
            recordId: result.data.recordId,
            fabricTxId: result.data.transactionId,
            timestamp: Date.now(),
            success: result.success
        };

    } catch (error) {
        console.error("Failed to save to Hyperledger Fabric:", error);
        throw error;
    }
};

/**
 * Query medical record from Hyperledger Fabric
 * @param recordId Record ID to retrieve
 * @returns Medical record data
 */
export const queryFabricRecord = async (recordId: string): Promise<FabricRecord> => {
    try {
        console.log(`Querying record ${recordId} from Fabric...`);

        const response = await fetch(`${FABRIC_API}/records/${recordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to query record: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;

    } catch (error) {
        console.error("Failed to query Fabric record:", error);
        throw error;
    }
};

/**
 * Get all medical records from Hyperledger Fabric
 * @returns Array of all records
 */
export const getAllFabricRecords = async (): Promise<FabricRecord[]> => {
    try {
        console.log("Fetching all records from Fabric...");

        const response = await fetch(`${FABRIC_API}/records`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch records: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];

    } catch (error) {
        console.error("Failed to fetch Fabric records:", error);
        throw error;
    }
};

/**
 * Get transaction history for a record
 * @param recordId Record ID
 * @returns Transaction history from Fabric ledger
 */
export const getTransactionHistory = async (recordId: string): Promise<any[]> => {
    try {
        console.log(`Fetching transaction history for ${recordId}...`);

        const response = await fetch(`${FABRIC_API}/records/${recordId}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn(`Could not fetch transaction history: ${response.statusText}`);
            return [];
        }

        const result = await response.json();
        return result.data || [];

    } catch (error) {
        console.error("Failed to fetch transaction history:", error);
        // Return empty array if history is not available
        return [];
    }
};

/**
 * Generate hash for data integrity verification
 * @param data Data to hash
 * @returns SHA256 hash
 */
const generateHash = (data: any): string => {
    // Simple hash generation - in production, use crypto-js or similar
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'HASH_' + Math.abs(hash).toString(16);
};

/**
 * Verify record integrity with Fabric
 * @param recordId Record ID
 * @param expectedHash Expected data hash
 * @returns Verification result
 */
export const verifyRecordIntegrity = async (recordId: string, expectedHash: string): Promise<boolean> => {
    try {
        const record = await queryFabricRecord(recordId);
        return record.dataHash === expectedHash;
    } catch (error) {
        console.error("Failed to verify record integrity:", error);
        return false;
    }
};
