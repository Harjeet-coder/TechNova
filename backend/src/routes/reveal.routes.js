const express = require('express');
const router = express.Router();
const controller = require('../controllers/reveal.controller');

router.post('/trigger', controller.manualReveal);

module.exports = router;