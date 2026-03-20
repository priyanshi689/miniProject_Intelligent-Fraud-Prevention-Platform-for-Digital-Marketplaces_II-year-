require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db.config');
const { connectRedis } = require('./src/config/redis.config');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('join_analyst_room', () => socket.join('analysts'));
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

const start = async () => {
  await connectDB();
  await connectRedis();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
