const express = require('express');
const router = express.Router();
const controller = require('../controllers/communication.controller');

// Timeline specific routes
router.get('/timeline/:case_id', controller.getTimeline);
router.post('/timeline', controller.addTimelineUpdate);

// Chat specific routes
router.get('/chat/:case_id', controller.getMessages);
router.post('/chat', controller.sendMessage);

module.exports = router;
