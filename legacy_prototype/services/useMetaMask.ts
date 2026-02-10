import { useState, useEffect, useCallback } from 'react';

// Contract ABI for MedicalDataRequest - only the functions we need
const CONTRACT_ABI = [
    "function requestPatientData(string memory _requestId, address _targetHospital, bytes32 _patientUID, string memory _purpose) public",
    "function approveRequest(string memory _requestId) public",
    "function rejectRequest(string memory _requestId) public",
    "function confirmApproval(string memory _requestId) public",
    "function anchorDataHash(string memory _requestId, bytes32 _dataHash) public",
    "function getRequestStatus(string memory _requestId) public view returns (uint8)",
    "function isAccessActive(string memory _requestId) public view returns (bool)",
    "function isHospitalRegistered(address _address) public view returns (bool)",
    "event DataRequestCreated(string indexed requestId, address indexed requestingHospital, address indexed targetHospital, bytes32 patientUID, string purpose, uint256 timestamp)",
    "event RequestApproved(string indexed requestId, address indexed targetHospital, address indexed requestingHospital, uint256 approvedAt, uint256 expiresAt)",
    "event ApprovalConfirmed(string indexed requestId, address indexed requestingHospital, address indexed targetHospital, uint256 confirmedAt, uint256 expiresAt)",
    "event RequestRejected(string indexed requestId, address indexed targetHospital, address indexed requestingHospital, uint256 timestamp)"
];

// Contract address - update this after deployment
const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// Ganache network config
const GANACHE_CHAIN_ID = "0x539"; // 1337 in hex
const GANACHE_RPC_URL = "http://127.0.0.1:8545";

export interface MetaMaskState {
    isInstalled: boolean;
    isConnected: boolean;
    account: string | null;
    chainId: string | null;
    isCorrectNetwork: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface TransactionResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

declare global {
    interface Window {
        ethereum?: any;
    }
}

export function useMetaMask() {
    const [state, setState] = useState<MetaMaskState>({
        isInstalled: false,
        isConnected: false,
        account: null,
        chainId: null,
        isCorrectNetwork: false,
        isLoading: true,
        error: null
    });

    // Check if MetaMask is installed
    const checkMetaMask = useCallback(() => {
        const isInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
        setState(prev => ({ ...prev, isInstalled, isLoading: false }));
        return isInstalled;
    }, []);

    // Connect to MetaMask
    const connect = useCallback(async (): Promise<string | null> => {
        if (!window.ethereum) {
            setState(prev => ({ ...prev, error: 'MetaMask tidak terinstall. Silakan install MetaMask.' }));
            return null;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('Tidak ada akun yang dipilih');
            }

            const account = accounts[0];
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const isCorrectNetwork = chainId === GANACHE_CHAIN_ID;

            setState({
                isInstalled: true,
                isConnected: true,
                account,
                chainId,
                isCorrectNetwork,
                isLoading: false,
                error: null
            });

            return account;
        } catch (error: any) {
            const errorMessage = error.code === 4001
                ? 'Koneksi ditolak oleh user'
                : error.message || 'Gagal connect ke MetaMask';

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
            return null;
        }
    }, []);

    // Disconnect (reset state)
    const disconnect = useCallback(() => {
        setState({
            isInstalled: true,
            isConnected: false,
            account: null,
            chainId: null,
            isCorrectNetwork: false,
            isLoading: false,
            error: null
        });
    }, []);

    // Switch to Ganache network
    const switchToGanache = useCallback(async (): Promise<boolean> => {
        if (!window.ethereum) return false;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: GANACHE_CHAIN_ID }]
            });

            setState(prev => ({ ...prev, chainId: GANACHE_CHAIN_ID, isCorrectNetwork: true }));
            return true;
        } catch (switchError: any) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: GANACHE_CHAIN_ID,
                            chainName: 'Ganache Local',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: [GANACHE_RPC_URL]
                        }]
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add Ganache network:', addError);
                    return false;
                }
            }
            console.error('Failed to switch network:', switchError);
            return false;
        }
    }, []);

    // Send transaction for data request
    const requestPatientData = useCallback(async (
        requestId: string,
        targetHospitalAddress: string,
        patientUIDHash: string,
        purpose: string
    ): Promise<TransactionResult> => {
        if (!window.ethereum || !state.account) {
            return { success: false, error: 'MetaMask tidak terkoneksi' };
        }

        try {
            // Import ethers dynamically
            const { ethers } = await import('ethers');

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Convert patientUID to bytes32
            const patientUIDBytes32 = ethers.keccak256(ethers.toUtf8Bytes(patientUIDHash));

            console.log('📤 Sending requestPatientData transaction...');
            console.log('   Request ID:', requestId);
            console.log('   Target Hospital:', targetHospitalAddress);
            console.log('   Purpose:', purpose);

            const tx = await contract.requestPatientData(
                requestId,
                targetHospitalAddress,
                patientUIDBytes32,
                purpose
            );

            console.log('⏳ Waiting for confirmation...');
            const receipt = await tx.wait();

            console.log('✅ Transaction confirmed!');
            console.log('   TX Hash:', receipt.hash);
            console.log('   Block:', receipt.blockNumber);

            return { success: true, txHash: receipt.hash };
        } catch (error: any) {
            console.error('❌ Transaction failed:', error);

            let errorMessage = 'Transaksi gagal';
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Transaksi dibatalkan oleh user';
            } else if (error.reason) {
                errorMessage = error.reason;
            } else if (error.message) {
                errorMessage = error.message;
            }

            return { success: false, error: errorMessage };
        }
    }, [state.account]);

    // Approve data request
    const approveRequest = useCallback(async (requestId: string): Promise<TransactionResult> => {
        if (!window.ethereum || !state.account) {
            return { success: false, error: 'MetaMask tidak terkoneksi' };
        }

        try {
            const { ethers } = await import('ethers');

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            console.log('📤 Approving request:', requestId);

            const tx = await contract.approveRequest(requestId);
            const receipt = await tx.wait();

            console.log('✅ Request approved! TX:', receipt.hash);

            return { success: true, txHash: receipt.hash };
        } catch (error: any) {
            console.error('❌ Approve failed:', error);

            let errorMessage = 'Gagal approve request';
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Transaksi dibatalkan oleh user';
            } else if (error.reason) {
                errorMessage = error.reason;
            }

            return { success: false, error: errorMessage };
        }
    }, [state.account]);

    // Reject data request
    const rejectRequest = useCallback(async (requestId: string): Promise<TransactionResult> => {
        if (!window.ethereum || !state.account) {
            return { success: false, error: 'MetaMask tidak terkoneksi' };
        }

        try {
            const { ethers } = await import('ethers');

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            console.log('📤 Rejecting request:', requestId);

            const tx = await contract.rejectRequest(requestId);
            const receipt = await tx.wait();

            console.log('✅ Request rejected! TX:', receipt.hash);

            return { success: true, txHash: receipt.hash };
        } catch (error: any) {
            console.error('❌ Reject failed:', error);

            let errorMessage = 'Gagal reject request';
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Transaksi dibatalkan oleh user';
            } else if (error.reason) {
                errorMessage = error.reason;
            }

            return { success: false, error: errorMessage };
        }
    }, [state.account]);

    // Confirm approval (called by REQUESTER - pays gas for final confirmation)
    const confirmApproval = useCallback(async (requestId: string): Promise<TransactionResult> => {
        if (!window.ethereum || !state.account) {
            return { success: false, error: 'MetaMask tidak terkoneksi' };
        }

        try {
            const { ethers } = await import('ethers');

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            console.log('📤 Confirming approval (requester pays gas):', requestId);

            const tx = await contract.confirmApproval(requestId);
            const receipt = await tx.wait();

            console.log('✅ Approval confirmed! TX:', receipt.hash);
            console.log('   Access granted for 24 hours!');

            return { success: true, txHash: receipt.hash };
        } catch (error: any) {
            console.error('❌ Confirm failed:', error);

            let errorMessage = 'Gagal konfirmasi approval';
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Transaksi dibatalkan oleh user';
            } else if (error.reason) {
                errorMessage = error.reason;
            }

            return { success: false, error: errorMessage };
        }
    }, [state.account]);

    // Listen for account and chain changes
    useEffect(() => {
        checkMetaMask();

        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setState(prev => ({ ...prev, account: accounts[0] }));
                }
            };

            const handleChainChanged = (chainId: string) => {
                setState(prev => ({
                    ...prev,
                    chainId,
                    isCorrectNetwork: chainId === GANACHE_CHAIN_ID
                }));
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Check if already connected
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) {
                        window.ethereum.request({ method: 'eth_chainId' })
                            .then((chainId: string) => {
                                setState({
                                    isInstalled: true,
                                    isConnected: true,
                                    account: accounts[0],
                                    chainId,
                                    isCorrectNetwork: chainId === GANACHE_CHAIN_ID,
                                    isLoading: false,
                                    error: null
                                });
                            });
                    }
                });

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [checkMetaMask, disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        switchToGanache,
        requestPatientData,
        approveRequest,
        rejectRequest,
        confirmApproval,
        contractAddress: CONTRACT_ADDRESS
    };
}

export default useMetaMask;
