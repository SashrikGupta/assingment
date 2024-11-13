import { io } from 'socket.io-client';

// Initialize Socket 1
export const initSocket1 = async () => {
  const options = {
    'force new connection': true,
    reconnectionAttempt: 'Infinity',
    timeout: 10000,
    transports: ['websocket'],
  };

  const socket1 = io("http://localhost:2981", options);

  socket1.on('connect', () => {
    console.log('Socket 1 connected');
  });

  socket1.on('connect_error', (error) => {
    console.error('Socket 1 connection error:', error.message);
  });

  return socket1;
};

// Initialize Socket 2
export const initSocket2 = async () => {
  const options = {
    'force new connection': true,
    reconnectionAttempt: 'Infinity',
    timeout: 10000,
    transports: ['websocket'],
  };

  const socket2 = io("http://localhost:2982", options);

  socket2.on('connect', () => {
    console.log('Socket 2 connected');
  });

  socket2.on('connect_error', (error) => {
    console.error('Socket 2 connection error:', error.message);
  });

  return socket2;
};
