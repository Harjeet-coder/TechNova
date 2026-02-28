const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/role', authController.checkRole);

module.exports = router;
