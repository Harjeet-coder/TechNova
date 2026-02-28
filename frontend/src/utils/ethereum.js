import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export const connectWallet = async (setAccount) => {
    if (window.ethereum) {
        try {
            // Force MetaMask to prompt account selection every single time for Hackathon demo
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            setAccount(accounts[0]);
            toast.success('Wallet connected successfully!');
            return accounts[0];
        } catch (error) {
            console.error('Wallet connection error:', error);
            toast.error('Failed to connect wallet');
        }
    } else {
        toast.error('Please install MetaMask to use this app');
    }
    return null;
};

export const checkConnection = async (setAccount) => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts',
            });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }
        } catch (error) {
            console.error('Failed to check connection:', error);
        }
    }
};

export const listenToAccountChanges = (setAccount) => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                toast.success('Account switched: ' + accounts[0].substring(0, 6) + '...');
            } else {
                setAccount(null);
                toast.error('Wallet disconnected');
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }
};

export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const disconnectWallet = (setAccount) => {
    // MetaMask doesn't have a true disconnect API, so we just clear the local state
    setAccount(null);
    toast.success('Disconnected. Please switch accounts in your MetaMask extension to reconnect.');
};
