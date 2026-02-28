const express = require('express');
const router = express.Router();
const controller = require('../controllers/authority.controller');

router.post('/approve', controller.approveAccess);

module.exports = router;