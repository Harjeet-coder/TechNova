import { ethers } from 'ethers';

export const signAuthMessage = async (account) => {
    try {
        if (!window.ethereum) throw new Error("No crypto wallet found");

        // Ethers v6 syntax
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Anti-replay attack mechanism: Use timestamp
        const timestamp = new Date().getTime();
        const message = `Authentication Request for Secure Intelligence Node
Wallet Address: ${account.toLowerCase()}
Challenge Timestamp: ${timestamp}
Purpose: Zero-Knowledge Verification`;

        const signature = await signer.signMessage(message);
        return { message, signature, address: account };
    } catch (error) {
        console.error("Signature error:", error);
        throw error;
    }
};
