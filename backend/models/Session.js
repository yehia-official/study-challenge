const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  currentQuestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  // Participants/Leaderboard embedded
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Session', sessionSchema);
