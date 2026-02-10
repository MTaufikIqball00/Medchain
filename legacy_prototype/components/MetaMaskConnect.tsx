import React from 'react';
import { Wallet, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useMetaMask } from '../services/useMetaMask';

interface MetaMaskConnectProps {
    onConnected?: (account: string) => void;
}

const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({ onConnected }) => {
    const {
        isInstalled,
        isConnected,
        account,
        isCorrectNetwork,
        isLoading,
        error,
        connect,
        disconnect,
        switchToGanache,
        contractAddress
    } = useMetaMask();

    const handleConnect = async () => {
        const account = await connect();
        if (account && onConnected) {
            onConnected(account);
        }
    };

    // Not installed
    if (!isInstalled && !isLoading) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-orange-800">MetaMask Tidak Terinstall</h3>
                        <p className="text-sm text-orange-600 mt-1">
                            Untuk melakukan transaksi blockchain, Anda perlu menginstall MetaMask.
                        </p>
                        <a
                            href="https://metamask.io/download/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                            Install MetaMask
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                    <span className="text-slate-600">Menghubungkan ke MetaMask...</span>
                </div>
            </div>
        );
    }

    // Not connected
    if (!isConnected) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">MetaMask Wallet</h3>
                            <p className="text-sm text-slate-500">Hubungkan wallet untuk transaksi blockchain</p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnect}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
                    >
                        Connect Wallet
                    </button>
                </div>
                {error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </div>
        );
    }

    // Connected but wrong network
    if (!isCorrectNetwork) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-yellow-800">Network Salah</h3>
                        <p className="text-sm text-yellow-600 mt-1">
                            Silakan switch ke network Ganache (Chain ID: 1337) untuk melakukan transaksi.
                        </p>
                        <button
                            onClick={switchToGanache}
                            className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                        >
                            Switch ke Ganache
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Connected and correct network
    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                            Wallet Terkoneksi
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        </h3>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5">
                            {account?.slice(0, 6)}...{account?.slice(-4)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        Ganache
                    </span>
                    <button
                        onClick={disconnect}
                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200">
                <p className="text-xs text-emerald-600">
                    <span className="font-medium">Contract:</span>{' '}
                    <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                        {contractAddress?.slice(0, 10)}...{contractAddress?.slice(-6)}
                    </code>
                </p>
            </div>
        </div>
    );
};

export default MetaMaskConnect;
