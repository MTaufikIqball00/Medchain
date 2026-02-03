/// <reference types="vite/client" />
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
    dataHash?: string; // Added to fix TS error
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
        // Get selected hospital from local state if possible, otherwise default
        const userSession = localStorage.getItem('medchain_user');
        let hospitalId = 'RS-A';
        if (userSession) {
            const user = JSON.parse(userSession);
            hospitalId = user.hospitalId || 'RS-A';
        }

        const response = await fetch(`${FABRIC_API}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-Token': 'MEDCHAIN_DEV_2026', // Bypass Auth
                'X-Hospital-Id': hospitalId // Context from Frontend
            },
            body: JSON.stringify({
                patient_uid: data.patientId, // Map patientId (frontend) to patient_uid (backend)
                patient_name: data.patientName,
                diagnosis: data.diagnosis,
                treatment: data.treatment,
                symptoms: data.symptoms,
                department: data.department || '',
                doctor_name: data.doctorName,
                // Backend generates other fields
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();

        console.log(`[Fabric] Transaction committed: ${result.data.fabric_tx_id}`);

        return {
            recordId: result.data.record_id,
            fabricTxId: result.data.fabric_tx_id,
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

        // Get context
        const userSession = localStorage.getItem('medchain_user');
        let hospitalId = 'RS-A';
        if (userSession) {
            const user = JSON.parse(userSession);
            hospitalId = user.hospitalId || 'RS-A';
        }

        const response = await fetch(`${FABRIC_API}/records`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-Token': 'MEDCHAIN_DEV_2026',
                'X-Hospital-Id': hospitalId
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
 * Search for a patient globally (even without record access)
 * @param patientUid Patient Unique ID (e.g., RM-001)
 * @returns Patient data or null
 */
export const searchGlobalPatient = async (patientUid: string): Promise<any | null> => {
    try {
        const userSession = localStorage.getItem('medchain_user');
        let hospitalId = 'RS-A';
        if (userSession) {
            const user = JSON.parse(userSession);
            hospitalId = user.hospitalId || 'RS-A';
        }

        const response = await fetch(`${API_BASE_URL}/patients/${patientUid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-Token': 'MEDCHAIN_DEV_2026',
                'X-Hospital-Id': hospitalId
            }
        });

        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Failed to search patient");

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Global patient search failed:", error);
        return null;
    }
};

/**
 * Request access to a medical record
 */
export const requestAccess = async (recordId: string, reason: string): Promise<any> => {
    const userSession = localStorage.getItem('medchain_user');
    let hospitalId = 'RS-A';
    if (userSession) {
        const user = JSON.parse(userSession);
        hospitalId = user.hospitalId || 'RS-A';
    }

    const response = await fetch(`${API_BASE_URL}/access/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Dev-Token': 'MEDCHAIN_DEV_2026',
            'X-Hospital-Id': hospitalId
        },
        body: JSON.stringify({ record_id: recordId, reason })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
};

/**
 * Get pending access requests (Inbox)
 */
export const getPendingAccessRequests = async (): Promise<any[]> => {
    const userSession = localStorage.getItem('medchain_user');
    let hospitalId = 'RS-A';
    if (userSession) {
        const user = JSON.parse(userSession);
        hospitalId = user.hospitalId || 'RS-A';
    }

    const response = await fetch(`${API_BASE_URL}/access/pending`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Dev-Token': 'MEDCHAIN_DEV_2026',
            'X-Hospital-Id': hospitalId
        }
    });

    const result = await response.json();
    return result.data || [];
};

/**
 * Grant access to a requester
 */
export const grantAccess = async (recordId: string, requesterHospitalId: string): Promise<any> => {
    const userSession = localStorage.getItem('medchain_user');
    let hospitalId = 'RS-A';
    if (userSession) {
        const user = JSON.parse(userSession);
        hospitalId = user.hospitalId || 'RS-A';
    }

    const response = await fetch(`${API_BASE_URL}/access/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Dev-Token': 'MEDCHAIN_DEV_2026',
            'X-Hospital-Id': hospitalId
        },
        body: JSON.stringify({ record_id: recordId, requester_hospital_id: requesterHospitalId })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
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
