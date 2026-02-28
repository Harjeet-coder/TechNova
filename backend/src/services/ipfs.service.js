const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function uploadFile(filePath) {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

        // We use string interpolation here so you can easily drop your API keys into the .env file later
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

        if (!pinataApiKey || !pinataSecretApiKey) {
            console.warn("⚠️ Pinata API Keys are missing in .env! Falling back to Mock Hash for IPFS.");
            return "QmMockHash" + Date.now();
        }

        let data = new FormData();
        data.append('file', fs.createReadStream(filePath));

        // Pinata metadata (optional but good for tracking)
        const metadata = JSON.stringify({
            name: `Encrypted_Evidence_${Date.now()}`
        });
        data.append('pinataMetadata', metadata);

        // Pinata options
        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        });
        data.append('pinataOptions', pinataOptions);

        const res = await axios.post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });

        console.log("Successfully securely pinned to IPFS via Pinata. CID:", res.data.IpfsHash);
        return res.data.IpfsHash;

    } catch (error) {
        console.error('IPFS Upload Error via Pinata:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    uploadFile
};