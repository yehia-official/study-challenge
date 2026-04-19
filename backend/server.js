require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const questionsRoutes = require('./routes/questions');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/questions', questionsRoutes);

// Socket.io Logic
const sessionLeaderboards = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-session', (data) => {
    // data can be joinCode string or { joinCode, profile }
    const joinCode = typeof data === 'string' ? data : data.joinCode;
    socket.join(joinCode);
    console.log(`User joined session: ${joinCode}`);
    
    // Sync leaderboard state for late joiners (or students transitioning from Arena)
    if (sessionLeaderboards[joinCode]) {
      socket.emit('leaderboard-sync', sessionLeaderboards[joinCode]);
    }
    
    if (typeof data === 'object' && data.profile) {
      // Notify professor
      io.to(joinCode).emit('participant-joined', data.profile);
    }
  });

  socket.on('push-question', (data) => {
    io.to(data.joinCode).emit('new-question', data.question);
  });

  socket.on('submit-answer', (data) => {
    if (!sessionLeaderboards[data.joinCode]) {
      sessionLeaderboards[data.joinCode] = {};
    }
    
    let userRecord = sessionLeaderboards[data.joinCode][data.userId];
    if (!userRecord) {
        userRecord = {
            userId: data.userId,
            displayName: data.displayName,
            totalGpaPoints: 0,
            questionsAnswered: 0,
            score: 0,
            streak: 0
        };
    }
    
    userRecord.questionsAnswered += 1;
    userRecord.totalGpaPoints += (data.gpaEarned || 0);
    userRecord.score = parseFloat((userRecord.totalGpaPoints / userRecord.questionsAnswered).toFixed(2));
    userRecord.streak = data.streak;
    
    sessionLeaderboards[data.joinCode][data.userId] = userRecord;

    io.to(data.joinCode).emit('leaderboard-update', userRecord);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database & Server Start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Use Memory Server only if no URI is provided
    if (!mongoUri) {
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('No MONGODB_URI found, using In-Memory MongoDB');
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB`);

    server.listen(PORT, () => {
      console.log(`Backend Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
