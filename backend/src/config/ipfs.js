const { create } = require('ipfs-http-client');
const dotenv = require('dotenv');

dotenv.config();

const ipfsUrl = process.env.IPFS_NODE_URL || 'http://localhost:5001';
const ipfs = create({ url: ipfsUrl });

module.exports = ipfs;