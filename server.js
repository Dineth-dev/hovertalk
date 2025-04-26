const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const pool = require('./db');
app.use(express.static('public'));


io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('chat message', async (data) => {
        io.emit('chat message', data)
        console.log(data.username);
        try{
            await pool.query('INSERT INTO messages (username,message, timestamp) VALUES ($1,$2, $3)', [data.username, data.message, data.timestamp]);
        } catch(err){
            console.error('Database insert error: ', err);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})