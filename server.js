const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const pool = require('./db');

app.use(express.static('public'));

app.use((req, res) => {
    res.status(404).send('404: Page not found');
}); 

io.on('connection', (socket) => {
    const connectTime = new Date().toLocaleString();
    console.log(`User connected at ${connectTime}`);
    socket.on('userJoined', (username) => {
        socket.username = username;
        io.emit('userNotification', `${username} has joined the chat`);
    })
    socket.on('sendChatMessage', async (data) => {
        io.emit('broadcastChatMessage', data); // Sends message to all connected clients
        try{
            await pool.query('INSERT INTO messages (username,message, timestamp) VALUES ($1,$2, $3)', [data.username, data.message, data.timestamp]);
        } catch(err){
            console.error('Database insert error: ', err);
        }
    });
    socket.on('disconnect', () => {
        if(socket.username){
            io.emit('userNotification', `${socket.username} has left the chat`);
        }
        console.log('User disconnected');
    });
    socket.on('getChatHistory', async () => {
        const result = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC');
        socket.emit('chatHistory', result.rows);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})