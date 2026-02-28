const { ethers } = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
const contractAddress = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

const provider = new ethers.JsonRpcProvider(rpcUrl);

// Use a backend relayer wallet
const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY || '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const wallet = new ethers.Wallet(privateKey, provider);

const abi = [
    "function registerCase(string cid, string hash, string anonID, string reveal_rule)",
    "function storeAuthenticityScore(string caseID, uint256 score)",
    "function updateRevealState(string caseID)",
    "function logAuthorityApproval(string caseID, address authorityAddress)",
    "function updateReputation(string anonID, uint256 amount)"
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

module.exports = { provider, wallet, contract };