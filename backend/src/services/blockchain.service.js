const { contract } = require('../config/blockchain');

async function registerCase(cid, hash, anonID, reveal_rule) {
    try {
        console.log(`Submitting case to Polygon Blockchain via relayer... CID: ${cid}`);
        const tx = await contract.registerCase(cid, hash, anonID, reveal_rule);
        await tx.wait();
        console.log(`Polygon Transaction Mined! Hash: ${tx.hash}`);
        return tx.hash;
    } catch (error) {
        console.error("Blockchain Register Case Error:", error.message || error);
        return "0xMockTxHashRegisterCase_Failed_Connection";
    }
}

async function storeAuthenticityScore(caseID, score) {
    try {
        const tx = await contract.storeAuthenticityScore(caseID, score);
        return tx.hash;
    } catch (error) {
        console.error("Blockchain storeAuthenticityScore Error:", error.message || error);
        return "0xMockTxHashStoreAuth";
    }
}

async function updateRevealState(caseID) {
    try {
        const tx = await contract.updateRevealState(caseID);
        return tx.hash;
    } catch (error) {
        return "0xMockTxHashUpdateReveal";
    }
}

async function logAuthorityApproval(caseID, authorityAddress) {
    try {
        const tx = await contract.logAuthorityApproval(caseID, authorityAddress);
        return tx.hash;
    } catch (error) {
        return "0xMockTxHashLogApproval";
    }
}

async function updateReputation(anonID, amount) {
    try {
        const tx = await contract.updateReputation(anonID, amount);
        return tx.hash;
    } catch (error) {
        return "0xMockTxHashUpdateReputation";
    }
}

module.exports = {
    registerCase,
    storeAuthenticityScore,
    updateRevealState,
    logAuthorityApproval,
    updateReputation
};