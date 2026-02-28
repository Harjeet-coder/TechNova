const { Server } = require('socket.io');
const { saveMessage } = require('../services/chat.service');

function initChatSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const chatNamespace = io.of('/ws/chat');

    chatNamespace.on('connection', (socket) => {
        console.log(`User connected to chat: ${socket.id}`);

        socket.on('join_room', (caseId) => {
            socket.join(caseId);
            console.log(`Socket ${socket.id} joined room ${caseId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                const { case_id, encrypted_message, sender_public_key, sender_type } = data;
                
                // Store safely in DB
                const savedMsg = await saveMessage(case_id, encrypted_message, sender_public_key, sender_type);

                // Broadcast purely the encrypted blob to others in the room
                socket.to(case_id).emit('receive_message', savedMsg);
            } catch (error) {
                console.error("Socket send_message error:", error);
            }
        });

        socket.on('disconnect', () => {
             console.log(`User disconnected: ${socket.id}`);
        });
    });
}

module.exports = initChatSocket;