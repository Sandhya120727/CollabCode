const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const Room = require('./models/Room');
const Log  = require('./models/Log');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collab-editor')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Room API
app.get('/api/room/:roomId', async (req, res) => {
  try {
    let room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) { room = new Room({ roomId: req.params.roomId }); await room.save(); }
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/room/:roomId/save', async (req, res) => {
  try {
    const { code, language } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId }, { code, language }, { new: true, upsert: true }
    );
    res.json({ success: true, room });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get logs for a room
app.get('/api/logs/:roomId', async (req, res) => {
  try {
    const logs = await Log.find({ roomId: req.params.roomId })
      .sort({ executedAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get ALL logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ executedAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Run Code Locally using child_process
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FILE_EXT = {
  javascript: 'js',
  python:     'py',
  java:       'java',
  c:          'c',
  cpp:        'cpp',
  go:         'go',
  php:        'php',
  ruby:       'rb',
  swift:      'swift',
  rust:       'rs',
};

const RUN_CMD = {
  javascript: (f) => `node "${f}"`,
  python:     (f) => `python3 "${f}"`,
  java:       (f, d) => `cd "${d}" && javac Main.java && java Main`,
  c:          (f, d) => `cd "${d}" && gcc main.c -o main && ./main`,
  cpp:        (f, d) => `cd "${d}" && g++ main.cpp -o main && ./main`,
  go:         (f) => `go run "${f}"`,
  php:        (f) => `php "${f}"`,
  ruby:       (f) => `ruby "${f}"`,
  swift:      (f) => `swift "${f}"`,
  rust:       (f, d) => `cd "${d}" && rustc main.rs -o main && ./main`,
};

app.post('/api/run', (req, res) => {
  const { code, language, username, roomId } = req.body;

  if (!FILE_EXT[language]) {
    return res.status(400).json({
      error: `"${language}" is not supported. Supported: JavaScript, Python, Java, C, C++, Go, PHP, Ruby, Swift, Rust`,
    });
  }
  if (!code || !code.trim()) return res.status(400).json({ error: 'No code provided.' });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-'));
  const fileName = language === 'java' ? 'Main.java' : `main.${FILE_EXT[language]}`;
  const filePath = path.join(tmpDir, fileName);

  fs.writeFileSync(filePath, code);

  const cmd = RUN_CMD[language](filePath, tmpDir);

  exec(cmd, { timeout: 10000 }, async (err, stdout, stderr) => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) {}

    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    const hasError = !!stderr && !stdout;
    const output   = stdout || stderr || '✅ Ran successfully with no output.';

    // Save log to MongoDB
    try {
      await Log.create({
        roomId:   roomId   || 'unknown',
        username: username || 'anonymous',
        language,
        code,
        output,
        error:    stderr || '',
        hasError,
      });
      console.log(`📝 Log saved — ${username} ran ${language} in room ${roomId}`);
    } catch (logErr) {
      console.error('Log save error:', logErr.message);
    }

    if (hasError) {
      return res.json({ stdout: stderr, stderr, hasError: true });
    }
    res.json({ stdout: output, stderr: '', hasError: false });
  });
});

// Socket.io
const rooms = {};
const USER_COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF922B','#CC5DE8','#20C997','#F06595'];
let colorIndex = 0;

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      let room = await Room.findOne({ roomId });
      if (!room) { room = new Room({ roomId }); await room.save(); }
      rooms[roomId] = { users: [], code: room.code, language: room.language };
    }
    const color = USER_COLORS[colorIndex++ % USER_COLORS.length];
    rooms[roomId].users.push({ id: socket.id, username, color });
    socket.emit('load-room', { code: rooms[roomId].code, language: rooms[roomId].language });
    io.to(roomId).emit('users-update', rooms[roomId].users);
    socket.to(roomId).emit('notification', { message: `${username} joined the room` });
  });

  socket.on('code-change', async ({ roomId, code }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].code = code;
    socket.to(roomId).emit('code-update', code);
    try { await Room.findOneAndUpdate({ roomId }, { code }, { upsert: true }); } catch (e) {}
  });

  socket.on('language-change', async ({ roomId, language }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].language = language;
    io.to(roomId).emit('language-update', language);
    try { await Room.findOneAndUpdate({ roomId }, { language }, { upsert: true }); } catch (e) {}
  });

  socket.on('cursor-move', ({ roomId, line, column, username, color }) => {
    socket.to(roomId).emit('cursor-update', { userId: socket.id, line, column, username, color });
  });

  socket.on('chat-message', ({ roomId, username, message, color }) => {
    io.to(roomId).emit('chat-message', { username, message, color, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const idx = rooms[roomId].users.findIndex((u) => u.id === socket.id);
      if (idx !== -1) {
        const { username } = rooms[roomId].users[idx];
        rooms[roomId].users.splice(idx, 1);
        io.to(roomId).emit('users-update', rooms[roomId].users);
        socket.to(roomId).emit('notification', { message: `${username} left the room` });
        if (rooms[roomId].users.length === 0) delete rooms[roomId];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
