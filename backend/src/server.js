const http = require('http');
const app = require('./app');
const initChatSocket = require('./sockets/chat.socket');
const { initCron } = require('./cron/reveal.cron');
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initChatSocket(server);

// Start Cron Jobs
initCron();

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});