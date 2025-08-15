const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const pool = require('./db');

async function fetchChatHistory(){
    const response = await fetch('https://gbdkepsurtoncfqhmogx.supabase.co/rest/v1/messages?select=*', {
        headers: {
            apikey: process.env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    const data = response.json();
    if(!response.ok) throw new Error(data.message || 'Error fetching message');
    return data;
}

app.get('/api/messages', async(req, res) => {
    try{
        const data = await fetchChatHistory();
        res.json(data);
    }catch(error){
        console.error('Fetch error: ', err.message);
        res.status(500).json({error: err.message});
    }
});

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
    socket.on('sendChatMessage', async(data) => {
        io.emit('broadcastChatMessage', data); // Sends message to all connected clients
        try {
            const response = await fetch(
                'https://gbdkepsurtoncfqhmogx.supabase.co/rest/v1/messages',
                {
                method: 'POST',
                headers: {
                    apikey: process.env.SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation',
                },
                body: JSON.stringify([
                    {
                    username: data.username,
                    message: data.message,
                    timestamp: data.timestamp,
                    },
                ]),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to insert message');
            }
        } catch (err) {
        console.error('Insert error:', err.message);
        }
    });
    
    socket.on('disconnect', () => {
        if(socket.username){
            io.emit('userNotification', `${socket.username} has left the chat`);
        }
        console.log('User disconnected');
    });
    socket.on('getChatHistory', async () => {
        try{
            const data = await fetchChatHistory();
            socket.emit('chatHistory', data);
        }catch(err){
            console.error('Fetch chat history error:', err.message);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

module.exports = app;