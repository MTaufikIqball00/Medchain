import { ethers } from 'ethers';

// ABI based on the Solidity Contract
const CONTRACT_ABI = [
  "function submitProof(string memory _recordId, string memory _dataHash) public",
  "function getProof(string memory _recordId) public view returns (tuple(string recordId, string dataHash, uint256 timestamp, address recorder))",
  "event ProofCreated(string indexed recordId, string dataHash, address indexed recorder, uint256 timestamp)"
];

// Placeholder Contract Address (would be set after real deployment)
// For simulation, we can use a mock approach or require the user to set it
const CONTRACT_ADDRESS = "0x...DEPLOYED_CONTRACT_ADDRESS...";

export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("MetaMask is not installed!");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
};

export const submitProofToEthereum = async (
  recordId: string,
  dataHash: string
): Promise<string> => {
  try {
    // 1. Check for Wallet
    if (typeof window.ethereum === 'undefined') {
      console.warn("MetaMask not found. Running in SIMULATION MODE.");
      return "0xSIMULATED_ETH_HASH_" + Math.random().toString(36).substring(7);
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 2. Instantiate Contract
    // NOTE: Since we likely don't have a deployed contract on the user's local network/testnet
    // and we don't want to block the demo, we will check if CONTRACT_ADDRESS is valid.

    if (CONTRACT_ADDRESS.includes("DEPLOYED_CONTRACT_ADDRESS")) {
        console.warn("Contract not deployed. Simulating transaction...");
        // Simulate a delay and return a fake hash
        await new Promise(r => setTimeout(r, 1500));

        // We can simulate a transaction signature to make it feel real
        // const signature = await signer.signMessage(`Sign proof for ${recordId}`);

        return "0xSIMULATED_TX_HASH_" + Date.now();
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // 3. Send Transaction
    const tx = await contract.submitProof(recordId, dataHash);
    console.log("Transaction sent:", tx.hash);

    // 4. Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt);

    return tx.hash;

  } catch (error) {
    console.error("Ethereum Transaction Failed:", error);
    throw error;
  }
};
