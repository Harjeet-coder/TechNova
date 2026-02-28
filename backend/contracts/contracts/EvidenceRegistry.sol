// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {

    struct CaseInfo {
        string ipfsCid;
        string fileHash;
        string anonId;
        string zkCategory;
        uint256 authenticityScore;
        string revealMode;
        uint256 timestamp;
        uint256 revealUnlockTime;
        bool revealed;
    }

    mapping(string => CaseInfo) public cases; 
    mapping(string => uint256) public reputationScore;

    event CaseRegistered(string caseId, string cid, string fileHash, string anonId, string revealMode);
    event AuthenticityStored(string caseId, uint256 score);
    event RevealTriggered(string caseId);
    event AuthorityApproved(string caseId, address authority);
    event ReputationUpdated(string anonId, uint256 score);

    function registerCase(
        string memory caseId,
        string memory cid,
        string memory fileHash,
        string memory anonId,
        string memory revealMode,
        uint256 revealUnlockTime,
        string memory zkCategory
    ) public {

        cases[caseId] = CaseInfo({
            ipfsCid: cid,
            fileHash: fileHash,
            anonId: anonId,
            zkCategory: zkCategory,
            authenticityScore: 0,
            revealMode: revealMode,
            timestamp: block.timestamp,
            revealUnlockTime: revealUnlockTime,
            revealed: false
        });

        emit CaseRegistered(caseId, cid, fileHash, anonId, revealMode);
    }

    function storeAuthenticityScore(string memory caseId, uint256 score) public {
        cases[caseId].authenticityScore = score;
        emit AuthenticityStored(caseId, score);
    }

    function triggerReveal(string memory caseId) public {
        cases[caseId].revealed = true;
        emit RevealTriggered(caseId);
    }

    function logAuthorityApproval(string memory caseId) public {
        emit AuthorityApproved(caseId, msg.sender);
    }

    function updateReputation(string memory anonId, uint256 value) public {
        reputationScore[anonId] += value;
        emit ReputationUpdated(anonId, reputationScore[anonId]);
    }
}
