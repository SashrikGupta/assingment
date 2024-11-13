const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const server = http.createServer(app);
const dotenv = require('dotenv'); // Import dotenv
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
dotenv.config({ path: './config.env' });
app.use(cors());
const PORT = process.env.PORT || 2982;

const io = new Server(server);
const userSocketMap = {};
const roomMessageQueues = {}; // Queue for messages in each room

const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  SYNC_CHANGE: 'sync-code',
  LEAVE: 'leave',
};

function getInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      resolve(input);
    });
  });
}

function getALLConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketid) => {
    return {
      socketid,
      username: userSocketMap[socketid],
    };
  });
}

function processMessageQueue(roomId) {
  const queue = roomMessageQueues[roomId];
  if (queue && queue.length > 0) {
    const { socket, event, payload } = queue.shift(); // Get the first item
    socket.to(roomId).emit(event, payload);
    // Process the next message after a delay to avoid overlap
    setTimeout(() => processMessageQueue(roomId), 10); // Adjust delay if needed
  }
}

function enqueueMessage(roomId, socket, event, payload) {
  if (!roomMessageQueues[roomId]) {
    roomMessageQueues[roomId] = [];
  }
  roomMessageQueues[roomId].push({ socket, event, payload });
  if (roomMessageQueues[roomId].length === 1) {
    processMessageQueue(roomId); // Start processing if the queue was empty
  }
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getALLConnectedClients(roomId);
    clients.forEach(({ socketid }) => {
      io.to(socketid).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketid: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    enqueueMessage(roomId, socket, ACTIONS.CODE_CHANGE, { code });
  });
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  socket.on('chat', async ({ roomId, chat_frame, username }) => {
    //const userInput = await getInput('Enter your message: ');
    console.log(username  , ": " , chat_frame)

    enqueueMessage(roomId, socket, 'chat', { chat_frame, username });
  });

  socket.on(ACTIONS.SYNC_CHANGE, ({ socketid, code }) => {
    io.to(socketid).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.use('/', (req, res) => {
  res.send(`hello ${PORT}`);
});

server.listen(PORT, () => {
  console.log('listening on port', PORT);
});
