import React, { useEffect, useState } from 'react';
import { getPendingAccessRequests, grantAccess } from '../services/fabricService';
import { useMetaMask } from '../services/useMetaMask';
import MetaMaskConnect from './MetaMaskConnect';
import { ShieldCheck, CheckCircle, XCircle, Clock, Building2, User, Wallet, Loader2, ExternalLink } from 'lucide-react';

interface AccessRequest {
    id: number;
    record_id: string;
    request_id?: string; // For blockchain
    requester_hospital_id: string;
    requester_name: string;
    owner_hospital_id: string;
    patient_uid: string;
    patient_name: string;
    reason: string;
    requested_at: string;
}

interface TransactionLog {
    type: 'approve' | 'reject';
    requestId: string;
    txHash: string;
    timestamp: Date;
}

const AccessManager: React.FC = () => {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
    const [txStatus, setTxStatus] = useState<string | null>(null);

    const {
        isConnected,
        isCorrectNetwork,
        account,
        approveRequest: approveOnChain,
        rejectRequest: rejectOnChain
    } = useMetaMask();

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getPendingAccessRequests();
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleGrant = async (req: AccessRequest) => {
        if (!isConnected || !isCorrectNetwork) {
            alert("Silakan hubungkan MetaMask ke jaringan Ganache terlebih dahulu!");
            return;
        }

        if (!confirm(`Grant access to ${req.requester_name}?\n\nIni akan mengirim transaksi ke blockchain via MetaMask.`)) return;

        setProcessingId(req.id);
        setTxStatus("Menunggu konfirmasi MetaMask...");

        try {
            // Generate request ID if not available
            const requestId = req.request_id || `REQ-${req.id}-${Date.now()}`;

            // 1. Send transaction to blockchain via MetaMask
            console.log("📤 Sending approve transaction via MetaMask...");
            const txResult = await approveOnChain(requestId);

            if (!txResult.success) {
                throw new Error(txResult.error || "Transaction failed");
            }

            setTxStatus("Transaksi dikonfirmasi! Memperbarui database...");

            // 2. Update backend/Fabric
            await grantAccess(req.record_id, req.requester_hospital_id, txResult.txHash);

            // 3. Log transaction
            setTransactionLogs(prev => [{
                type: 'approve',
                requestId,
                txHash: txResult.txHash!,
                timestamp: new Date()
            }, ...prev]);

            alert(`✅ Access Granted!\n\nTransaction Hash:\n${txResult.txHash}`);
            loadRequests(); // Reload list

        } catch (error: any) {
            console.error("Grant failed:", error);
            alert("❌ Failed to grant access:\n" + (error.message || error));
        } finally {
            setProcessingId(null);
            setTxStatus(null);
        }
    };

    const handleReject = async (req: AccessRequest) => {
        if (!isConnected || !isCorrectNetwork) {
            alert("Silakan hubungkan MetaMask ke jaringan Ganache terlebih dahulu!");
            return;
        }

        if (!confirm(`Reject request from ${req.requester_name}?\n\nIni akan mengirim transaksi penolakan ke blockchain.`)) return;

        setProcessingId(req.id);
        setTxStatus("Menunggu konfirmasi MetaMask...");

        try {
            const requestId = req.request_id || `REQ-${req.id}-${Date.now()}`;

            // Send reject transaction via MetaMask
            console.log("📤 Sending reject transaction via MetaMask...");
            const txResult = await rejectOnChain(requestId);

            if (!txResult.success) {
                throw new Error(txResult.error || "Transaction failed");
            }

            // Log transaction
            setTransactionLogs(prev => [{
                type: 'reject',
                requestId,
                txHash: txResult.txHash!,
                timestamp: new Date()
            }, ...prev]);

            alert(`✅ Request Rejected!\n\nTransaction Hash:\n${txResult.txHash}`);
            loadRequests();

        } catch (error: any) {
            console.error("Reject failed:", error);
            alert("❌ Failed to reject:\n" + (error.message || error));
        } finally {
            setProcessingId(null);
            setTxStatus(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-medical-100 p-3 rounded-full text-medical-600">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Access Requests</h2>
                    <p className="text-slate-500">Manage data access requests from other hospitals</p>
                </div>
            </div>

            {/* MetaMask Connection Card */}
            <MetaMaskConnect />

            {/* Transaction Status Banner */}
            {txStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-blue-700 font-medium">{txStatus}</span>
                </div>
            )}

            {/* Recent Transactions */}
            {transactionLogs.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Transaksi Terbaru
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {transactionLogs.slice(0, 5).map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                                <div className="flex items-center gap-2">
                                    {log.type === 'approve' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="font-medium text-slate-700">
                                        {log.type === 'approve' ? 'Approved' : 'Rejected'}
                                    </span>
                                    <code className="text-slate-500">{log.requestId}</code>
                                </div>
                                <a
                                    href={`#tx-${log.txHash}`}
                                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                    title={log.txHash}
                                >
                                    {log.txHash.slice(0, 8)}...
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Request List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">No Pending Requests</h3>
                    <p className="text-slate-500 text-sm">You're all caught up!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                            Requesting Access
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(req.requested_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        {req.requester_name} ({req.requester_hospital_id})
                                    </h3>

                                    <div className="pl-7 text-sm text-slate-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            Target Patient: <span className="font-semibold">{req.patient_name}</span> ({req.patient_uid})
                                        </div>
                                        <div className="italic text-slate-500 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                                            "Reason: {req.reason || 'No reason provided'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <button
                                        onClick={() => handleReject(req)}
                                        disabled={processingId === req.id || !isConnected}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleGrant(req)}
                                        disabled={processingId === req.id || !isConnected}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {processingId === req.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* MetaMask hint */}
                            {!isConnected && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <Wallet className="w-3 h-3" />
                                        Hubungkan MetaMask untuk menyetujui/menolak request
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccessManager;
