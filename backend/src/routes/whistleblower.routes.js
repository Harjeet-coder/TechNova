const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/whistleblower.controller');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('evidence'), controller.uploadEvidence);
router.get('/status/:case_id', controller.getCaseStatus);
router.get('/cases/:anon_id', controller.getWhistleblowerCases);
router.post('/verify-category', controller.verifyCategory);
router.post('/trigger-reveal', controller.triggerReveal);

module.exports = router;