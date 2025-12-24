import React, { useMemo, useState, useEffect } from 'react';
import { Block, MedicalRecordData } from '../types';
import { decryptText } from '../utils/encryptionUtils';
import { ArrowLeft, PlusCircle, User, Clock, Stethoscope, FileText, Lock, Loader2, Building2 } from 'lucide-react';

interface PatientDetailProps {
  patientId: string;
  chain: Block[];
  onBack: () => void;
  onAddRecord: (patientId: string, patientName: string) => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, chain, onBack, onAddRecord }) => {
  const [decryptedRecords, setDecryptedRecords] = useState<{block: Block, data: MedicalRecordData}[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);

  const patientRecords = useMemo(() => {
    return chain
      .filter(block => block.data.patientId === patientId)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [chain, patientId]);

  // Handle Decryption of history
  useEffect(() => {
    const decryptHistory = async () => {
      setIsDecrypting(true);
      const processed = await Promise.all(patientRecords.map(async (block) => {
        if (!block.data.isEncrypted) {
            return { block, data: block.data };
        }
        
        try {
            const d = { ...block.data };
            d.diagnosis = await decryptText(block.data.diagnosis);
            d.treatment = await decryptText(block.data.treatment);
            d.notes = await decryptText(block.data.notes);
            if (d.aiAnalysis) d.aiAnalysis = await decryptText(d.aiAnalysis);
            return { block, data: d };
        } catch (e) {
            console.error("Failed to decrypt record", e);
            return { block, data: block.data };
        }
      }));
      setDecryptedRecords(processed);
      setIsDecrypting(false);
    };

    if (patientRecords.length > 0) {
        decryptHistory();
    } else {
        setIsDecrypting(false);
    }
  }, [patientRecords]);

  if (patientRecords.length === 0) {
    return (
      <div className="text-center p-8">
        <p>Patient not found.</p>
        <button onClick={onBack} className="text-blue-500 underline">Go Back</button>
      </div>
    );
  }

  // Assuming name is consistent or taking the latest
  const patientName = patientRecords[0].data.patientName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Direktori
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-medical-100 rounded-full flex items-center justify-center text-medical-600">
               <User className="w-8 h-8" />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{patientName}</h2>
               <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                 <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {patientId}</span>
                 <span>•</span>
                 <span>{patientRecords.length} Kunjungan</span>
               </div>
            </div>
         </div>
         
         <button
           onClick={() => onAddRecord(patientId, patientName)}
           className="bg-medical-600 hover:bg-medical-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-colors"
         >
           <PlusCircle className="w-5 h-5" />
           Input Rekam Medis
         </button>
      </div>

      {isDecrypting ? (
          <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-medical-500 animate-spin" />
                  <p className="text-sm text-slate-500">Mendekripsi riwayat medis...</p>
              </div>
          </div>
      ) : (
        /* Timeline */
        <div className="relative pl-8 border-l-2 border-slate-200 space-y-8 ml-4">
            {decryptedRecords.map(({ block, data }) => (
            <div key={block.hash} className="relative">
                {/* Dot */}
                <div className="absolute -left-[41px] top-4 w-5 h-5 rounded-full bg-white border-4 border-medical-500"></div>
                
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-4 text-slate-500 text-sm mb-2 sm:mb-0">
                        <span className="flex items-center gap-1">
                             <Clock className="w-4 h-4" />
                             {new Date(block.timestamp).toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                        </span>
                        {data.department && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                <Building2 className="w-3 h-3" /> {data.department}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {data.isEncrypted && (
                          <span title="Encrypted Record" className="flex items-center">
                            <Lock className="w-3 h-3 text-amber-500" />
                          </span>
                        )}
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Block #{block.index}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Diagnosa
                        </h4>
                        <p className="text-lg font-medium text-slate-800">{data.diagnosis}</p>
                        <div className="mt-3">
                        <h5 className="text-xs font-semibold text-slate-400 mb-1">TERAPI / TINDAKAN</h5>
                        <p className="text-slate-700 text-sm">{data.treatment}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Catatan Dokter (Anamnesa & Fisik)
                        </h4>
                        <p className="text-sm text-slate-700 mb-2 font-semibold">Anamnesa: {data.symptoms}</p>
                        <p className="text-sm text-slate-600 italic leading-relaxed">"Obj: {data.notes}"</p>
                        
                        <div className="mt-3 text-xs text-right text-slate-500 font-medium">
                        — {data.doctorName}
                        </div>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default PatientDetail;