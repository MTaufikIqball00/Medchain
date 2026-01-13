export interface MedicalRecordData {
  patientId: string;
  patientName: string;
  department: string; // New field: Poli (e.g., Umum, Gigi)
  symptoms: string;
  diagnosis: string;
  treatment: string;
  doctorName: string;
  notes: string;
  aiAnalysis?: string;
  timestamp: number;
  isEncrypted?: boolean;
}

export interface Block {
  index: number;
  timestamp: number;
  data: MedicalRecordData;
  previousHash: string;
  hash: string;
  nonce: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_RECORD = 'ADD_RECORD',
  BLOCKCHAIN = 'BLOCKCHAIN',
  PATIENTS_LIST = 'PATIENTS_LIST',
  PATIENT_DETAIL = 'PATIENT_DETAIL',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export interface GeminiAnalysisResult {
  suggestedDiagnosis: string;
  summary: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedActions: string[];
}