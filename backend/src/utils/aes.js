const crypto = require('crypto');

function generateRandomIV() {
    return crypto.randomBytes(12);
}

function encryptWithPublicKey(publicKeyPem, data) {
    if(!publicKeyPem || !data) return null;
    try {
        const buffer = Buffer.from(data, 'utf8');
        const encrypted = crypto.publicEncrypt({
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        }, buffer);
        return encrypted.toString('base64');
    } catch(err) {
        console.error("AES encryption with PK error", err);
        return null;
    }
}

module.exports = {
    generateRandomIV,
    encryptWithPublicKey
};