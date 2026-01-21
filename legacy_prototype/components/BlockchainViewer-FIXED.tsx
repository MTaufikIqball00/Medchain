import React, { useState } from 'react';
import { Block, MedicalRecordData } from '../types';
import { decryptText } from '../utils/encryptionUtils';
import { ShieldCheck, Box, Hash, ExternalLink, Clock, FileText, X, CheckCircle, Database, Lock, Unlock } from 'lucide-react';

interface BlockchainViewerProps {
  chain: Block[];
  isValid: boolean;
}

const BlockchainViewer: React.FC<BlockchainViewerProps> = ({ chain, isValid }) => {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [decryptedData, setDecryptedData] = useState<MedicalRecordData | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Copy hash to clipboard instead of opening Etherscan
  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      alert('Transaction Hash copied to clipboard! ✅');
    });
  };

  const handleBlockSelect = (block: Block) => {
    setSelectedBlock(block);
    setDecryptedData(null); // Reset decryption state
  };

  const handleDecrypt = async () => {
    if (!selectedBlock) return;
    setIsDecrypting(true);
    
    // Simulate decryption delay and process
    try {
        const decrypted: MedicalRecordData = { ...selectedBlock.data };
        
        if (selectedBlock.data.isEncrypted) {
            decrypted.symptoms = await decryptText(selectedBlock.data.symptoms);
            decrypted.diagnosis = await decryptText(selectedBlock.data.diagnosis);
            decrypted.treatment = await decryptText(selectedBlock.data.treatment);
            decrypted.notes = await decryptText(selectedBlock.data.notes);
            if(decrypted.aiAnalysis) {
                decrypted.aiAnalysis = await decryptText(decrypted.aiAnalysis);
            }
        }
        setDecryptedData(decrypted);
    } catch (e) {
        console.error(e);
    } finally {
        setIsDecrypting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-medical-600" />
          Blockchain Ledger
        </h2>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <ShieldCheck className="w-4 h-4" />
          Status: {isValid ? 'Integrity Verified' : 'Chain Compromised'}
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Block #</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Txn Hash</th>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Encryption</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Show newest blocks first */}
              {chain.slice().reverse().map((block) => (
                <tr 
                   key={block.hash} 
                   onClick={() => handleBlockSelect(block)}
                   className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                   <td className="px-6 py-4 font-mono text-slate-900 group-hover:text-medical-600">
                     <div className="flex items-center gap-2">
                       <Box className="w-4 h-4 text-slate-400 group-hover:text-medical-500" />
                       {block.index}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                       <span className="flex items-center gap-1.5">
                           <Clock className="w-3.5 h-3.5 text-slate-400" />
                           {new Date(block.timestamp).toLocaleString()}
                       </span>
                   </td>
                   <td className="px-6 py-4 font-mono text-blue-600 truncate max-w-[150px]">
                       {block.hash.substring(0, 18)}...
                   </td>
                   <td className="px-6 py-4 font-medium text-slate-900">
                       {block.data.patientId === "GENESIS" ? (
                         <span className="text-slate-400 italic">System</span>
                       ) : (
                         block.data.patientId
                       )}
                   </td>
                   <td className="px-6 py-4">
                       {block.data.isEncrypted ? (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                               <Lock className="w-3 h-3" /> AES-256
                           </span>
                       ) : (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                               <Unlock className="w-3 h-3" /> Public
                           </span>
                       )}
                   </td>
                   <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                           <CheckCircle className="w-3 h-3" /> Confirmed
                       </span>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedBlock(null)}>
           <div 
             className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" 
             onClick={e => e.stopPropagation()}
           >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Box className="w-6 h-6 text-medical-600" />
                        Transaction Details (Hyperledger Fabric)
                    </h3>
                    <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Hash Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Transaction Hash</label>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="bg-slate-100 p-3 rounded-lg text-sm text-slate-700 break-all font-mono flex-1 border border-slate-200">
                                    {selectedBlock.hash}
                                </code>
                                <button 
                                  onClick={() => copyHashToClipboard(selectedBlock.hash)} 
                                  className="p-3 bg-medical-50 text-medical-600 hover:bg-medical-100 rounded-lg transition-colors border border-medical-100" 
                                  title="Copy hash to clipboard (Hyperledger Fabric)"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Block Height</label>
                                <div className="mt-1 text-slate-800 font-mono font-semibold">#{selectedBlock.index}</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Timestamp</label>
                                <div className="mt-1 text-slate-800 font-medium">{new Date(selectedBlock.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>ℹ️ Fabric-only Mode:</strong> This transaction is stored on Hyperledger Fabric, not Ethereum. No external link available.
                            </p>
                        </div>
                    </div>

                    {/* Data Payload Section */}
                    <div className="border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" /> Recorded Data
                            </h4>
                            {selectedBlock.data.isEncrypted && !decryptedData && (
                                <button 
                                  onClick={handleDecrypt}
                                  className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200 hover:bg-amber-200 transition-colors flex items-center gap-1"
                                >
                                  {isDecrypting ? 'Decrypting...' : <><Lock className="w-3 h-3" /> Decrypt Payload</>}
                                </button>
                            )}
                            {decryptedData && (
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold border border-green-200 flex items-center gap-1">
                                    <Unlock className="w-3 h-3" /> Decrypted
                                </span>
                            )}
                        </div>
                        
                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 shadow-inner relative overflow-hidden">
                            <pre className={`text-xs whitespace-pre-wrap font-mono overflow-x-auto ${decryptedData ? 'text-green-400' : 'text-amber-500'}`}>
                                {JSON.stringify(decryptedData || selectedBlock.data, null, 2)}
                            </pre>
                            {!decryptedData && selectedBlock.data.isEncrypted && (
                                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center pointer-events-none">
                                    <div className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded border border-slate-700 shadow-lg">
                                        Encrypted (AES-GCM)
                                    </div>
                                </div>
                            )}
                        </div>
                        {selectedBlock.data.isEncrypted && !decryptedData && (
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                * Requires Consortium Private Key to decrypt patient vitals.
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                   <button 
                     onClick={() => setSelectedBlock(null)}
                     className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
                   >
                     Close Details
                   </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default BlockchainViewer;
