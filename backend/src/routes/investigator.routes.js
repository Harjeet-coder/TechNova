const express = require('express');
const router = express.Router();
const controller = require('../controllers/investigator.controller');

router.post('/verify-wallet', controller.verifyWallet);
router.get('/cases', controller.listCases);
router.post('/request-access', controller.requestAccess);
router.get('/download/:case_id', controller.downloadEncryptedFile);
router.post('/report', controller.updateReport);
router.get('/shares', controller.getApprovedShares);

module.exports = router;