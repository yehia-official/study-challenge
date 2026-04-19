const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: false },
  professorId: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'essay'],
    default: 'multiple_choice',
    required: true,
  },
  text: { type: String, required: true },
  options: [{
    id: String, // A, B, C, D, E …  (not used for essay)
    text: String,
  }],
  correctOptionId: { type: String, required: false }, // null for essay questions
  points: { type: Number, default: 800 },
  timeLimitSecs: { type: Number, default: 30 },
  order: { type: Number, required: false, default: 0 },
  status: { type: String, enum: ['draft', 'active', 'finished'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
