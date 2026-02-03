import React, { useState, useMemo } from 'react';
import { Block } from '../types';
import { Search, UserPlus, Users, ArrowRight, Calendar } from 'lucide-react';

interface PatientListProps {
  chain: Block[];
  onSelectPatient: (patientId: string) => void;
  onAddNew: () => void;
}

const PatientList: React.FC<PatientListProps> = ({ chain, onSelectPatient, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-medical-500 focus:border-medical-500 sm:text-sm shadow-sm"
          placeholder="Search by Patient Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
             <Search className="w-6 h-6 text-slate-400" />
           </div>
           <h3 className="text-lg font-medium text-slate-900">No patients found</h3>
           <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
             We couldn't find any patients matching "{searchTerm}". 
           </p>
           {searchTerm && (
             <button 
               onClick={onAddNew}
               className="mt-4 text-medical-600 font-medium hover:text-medical-700"
             >
               Create new record for this patient?
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default PatientList;