# Blockchain-Backed Anonymous Whistleblower Protection System (TechNova)

A decentralized, zero-trust enterprise platform designed to protect whistleblower identities while mathematically guaranteeing the integrity of submitted evidence using Polygon blockchain, IPFS, and Shamir's Secret Sharing (SSS).

## 🚀 Key Features
- **MetaMask Authentication**: Role-Based Access Control (RBAC) via Web3 cryptographic signatures.
- **Absolute Anonymity**: Identities are completely stripped. Users exist only as ephemeral sessions when submitting evidence.
- **Decentralized Storage**: Evidence is uploaded securely via **IPFS** (InterPlanetary File System).
- **Zero-Knowledge Architecture**: Files are encrypted Client-Side using **AES-256** before they ever hit the server.
- **Shamir's Secret Sharing (SSS)**: The AES Decryption Key is mathematically shattered into 3 fragments. At least 2 out of 3 Administrators must independently approve the release of their fragment to reconstruct the key.
- **Immutable Audit Logging**: Every major action is anchored forever on the **Polygon Blockchain** using smart contracts.

---

## 🏗 System Architecture

1. **Frontend**: React (Vite), Framer Motion, Ethers.js, Tailwind/Vanilla CSS
2. **Backend**: Node.js, Express, Multer
3. **Database**: Supabase (PostgreSQL)
4. **Storage**: IPFS (Pinata)
5. **Smart Contracts**: Solidity (deployed on Polygon Amoy Testnet)
6. **Cryptography**: CryptoJS (AES-256), `secrets.js` (SSS)

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension
- A [Supabase](https://supabase.com/) account
- A [Pinata](https://pinata.cloud/) account for IPFS
- Polygon Amoy testnet tokens (MATIC) from a faucet

---

## ⚙️ Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Harjeet-coder/TechNova.git
cd TechNova
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

POLYGON_RPC_URL=your_polygon_rpc_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_smart_contract_address
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the frontend Vite server:
```bash
npm run dev
```

### 4. Smart Contract Deployment (Optional)
If you need to deploy the smart contract yourself:
```bash
cd backend/contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

---

## 🔒 Security Posture
- **No Central Point of Failure**: Admins do not possess the full key. They only possess mathematically useless fragments until combined by the Investigator.
- **Client-Side execution**: All decryption happens directly inside the Investigator's browser RAM. The server never sees the decrypted file.
- **Rate-Limiting & Signature Verification**: Every API route enforces Web3 signature verification to prevent spoofing.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
