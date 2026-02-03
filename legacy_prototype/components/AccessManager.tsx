import React, { useEffect, useState } from 'react';
import { getPendingAccessRequests, grantAccess } from '../services/fabricService';
import { ShieldCheck, CheckCircle, XCircle, Clock, Building2, User } from 'lucide-react';

interface AccessRequest {
    id: number;
    record_id: string;
    requester_hospital_id: string;
    requester_name: string;
    owner_hospital_id: string;
    patient_uid: string;
    patient_name: string;
    reason: string;
    requested_at: string;
}

const AccessManager: React.FC = () => {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

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
        if (!confirm(`Grant access to ${req.requester_name}?`)) return;

        setProcessingId(req.id);
        try {
            await grantAccess(req.record_id, req.requester_hospital_id);
            alert("Access Granted!");
            loadRequests(); // Reload list
        } catch (error) {
            alert("Failed to grant access: " + error);
        } finally {
            setProcessingId(null);
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
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() => handleGrant(req)}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {processingId === req.id ? 'Processing...' : (
                                            <>
                                                <CheckCircle className="w-4 h-4" /> Grant Access
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccessManager;
