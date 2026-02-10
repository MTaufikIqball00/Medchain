import React, { useState, useMemo } from 'react';
import { Block } from '../types';
import { Search, UserPlus, Users, ArrowRight, Calendar, Globe, ShieldQuestion, ShieldCheck } from 'lucide-react';
import { searchGlobalPatient, requestAccess } from '../services/fabricService';

interface PatientListProps {
  chain: Block[];
  onSelectPatient: (patientId: string) => void;
  onAddNew: () => void;
}

// Hospital Address Mapping (from Deployment)
const HOSPITAL_ADDRESSES: { [key: string]: string } = {
  'RS-A': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  'RS-B': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  'RS-HASAN-SADIKIN': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  'RS-SILOAM': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  'RS-HERMINA': '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
};

import { useMetaMask } from '../services/useMetaMask';

const PatientList: React.FC<PatientListProps> = ({ chain, onSelectPatient, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalResult, setGlobalResult] = useState<any>(null);
  const [requestStatus, setRequestStatus] = useState<string>('');

  const { isConnected, connect, requestPatientData } = useMetaMask();

  // ... (useMemo remains same) ...
  const patients = useMemo(() => {
    const patientMap = new Map<string, {
      id: string;
      name: string;
      lastVisit: number;
      recordCount: number;
    }>();

    chain.forEach(block => {
      if (block.index === 0) return; // Skip genesis
      const { patientId, patientName, timestamp } = block.data;

      const existing = patientMap.get(patientId);
      if (existing) {
        existing.lastVisit = Math.max(existing.lastVisit, timestamp);
        existing.recordCount += 1;
        // Update name in case it changed/corrected in newer records, relying on latest
        if (timestamp >= existing.lastVisit) {
          existing.name = patientName;
        }
      } else {
        patientMap.set(patientId, {
          id: patientId,
          name: patientName,
          lastVisit: timestamp,
          recordCount: 1
        });
      }
    });

    return Array.from(patientMap.values());
  }, [chain]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGlobalSearch = async () => {
    if (!searchTerm) return;
    setIsSearchingGlobal(true);
    setGlobalResult(null);
    setRequestStatus('');

    try {
      // Assume user searches by ID for global search (or name if backend supports it, but simple ID for now)
      const result = await searchGlobalPatient(searchTerm);
      if (result) {
        setGlobalResult(result);
      } else {
        setGlobalResult(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingGlobal(false);
    }
  };

  const handleRequestAccess = async (recordId: string, hospitalId: string, patientUid: string) => {
    if (!recordId) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) return alert("Please connect MetaMask first!");
    }

    try {
      setRequestStatus("Initiating transaction with MetaMask...");

      const targetAddress = HOSPITAL_ADDRESSES[hospitalId];
      if (!targetAddress) {
        throw new Error(`Address for hospital ${hospitalId} not found`);
      }

      // Generate Request ID
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const purpose = "Emergency Access - Prototype";

      // 1. Call Smart Contract via MetaMask
      const txResult = await requestPatientData(requestId, targetAddress, patientUid, purpose);

      if (!txResult.success) {
        throw new Error(txResult.error);
      }

      setRequestStatus("Transaction confirmed! Syncing with backend...");

      // 2. Sync with Backend
      // We use a custom fetch here to pass eth_tx_hash to the existing endpoint
      const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';
      const userSession = localStorage.getItem('medchain_user');
      let myHospitalId = 'RS-A';
      if (userSession) {
        const user = JSON.parse(userSession);
        myHospitalId = user.hospitalId || 'RS-A';
      }

      const response = await fetch(`${API_BASE_URL}/access/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Token': 'MEDCHAIN_DEV_2026',
          'X-Hospital-Id': myHospitalId
        },
        body: JSON.stringify({
          record_id: recordId,
          reason: purpose,
          request_id: requestId, // Blockchain request ID - needed for approve flow
          eth_tx_hash: txResult.txHash // Pass hash to skip backend blockchain call
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setRequestStatus(`Request sent successfully! TX: ${txResult.txHash?.slice(0, 10)}...`);
    } catch (err: any) {
      alert("Failed: " + err.message);
      setRequestStatus("Request failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-medical-600" />
            Patient Directory
          </h2>
          <p className="text-slate-500 text-sm">Manage and search patient records</p>
        </div>

        <button
          onClick={onAddNew}
          className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-medical-500 focus:border-medical-500 sm:text-sm shadow-sm"
            placeholder="Search by Patient Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
          />
        </div>
        <button
          onClick={handleGlobalSearch}
          disabled={isSearchingGlobal}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
        >
          {isSearchingGlobal ? 'Searching...' : <Globe className="w-4 h-4" />}
          Global Search
        </button>
      </div>

      {/* Global Search Result */}
      {globalResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-fade-in shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-amber-800 flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5" /> Patient Found in National Registry
              </h3>
              <p className="font-semibold text-slate-800 mt-1 text-lg">{globalResult.full_name}</p>
              <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                <span className="font-mono bg-amber-100 px-2 rounded text-amber-900 border border-amber-200">{globalResult.patient_uid}</span>
                <span>|</span>
                <span>Born: {new Date(globalResult.date_of_birth).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Discovery Records List */}
          <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
            <div className="px-4 py-2 bg-amber-100/50 border-b border-amber-100 text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Available Medical Records
            </div>
            {globalResult.medical_records && globalResult.medical_records.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {globalResult.medical_records.map((rec: any) => (
                  <div key={rec.record_id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rec.hospital_id}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {rec.department || 'General Care'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: {rec.record_id}
                      </div>
                      <div className="text-xs text-slate-400">
                        Date: {new Date(rec.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestAccess(rec.record_id, rec.hospital_id, globalResult.patient_uid)}
                      className="bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                      <ShieldQuestion className="w-4 h-4" />
                      Request Access
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                No medical records found for this patient.
                <br />
                <button onClick={onAddNew} className="text-medical-600 font-medium hover:underline mt-1">Create first record?</button>
              </div>
            )}
          </div>

          {requestStatus && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 animate-fade-in">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">{requestStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-medical-300 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="bg-medical-50 text-medical-700 px-2 py-1 rounded text-xs font-mono font-medium">
                  {patient.id}
                </div>
                <div className="text-slate-300 group-hover:text-medical-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">{patient.name}</h3>

              <div className="flex items-center gap-2 text-sm text-slate-500 mt-4 pt-4 border-t border-slate-50">
                <Calendar className="w-4 h-4" />
                <span>Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                {patient.recordCount} {patient.recordCount === 1 ? 'Record' : 'Records'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !globalResult && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No local patients found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Try using <b>Global Search</b> to find patients from other hospitals.
            </p>
          </div>
        )
      )}
    </div>
  );
};
export default PatientList;