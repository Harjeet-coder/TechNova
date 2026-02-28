const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');

router.post('/verify-wallet', controller.verifyWallet);
router.post('/assign-investigator', controller.assignInvestigator);
router.get('/stats', controller.getStats);
router.get('/cases', controller.getAllCases);
router.get('/investigators', controller.getAllInvestigators);
router.get('/keys', controller.getAdminKeys);
router.get('/requests', controller.getAccessRequests);
router.post('/approve-request', controller.approveRequest);

module.exports = router;