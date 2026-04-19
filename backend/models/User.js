const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['professor', 'student'],
    required: true,
  },
  avatarUrl: {
    type: String,
    default: function() {
      // Generate a dynamic dicebear avatar based on name + random seed
      const seed = encodeURIComponent(this.displayName + Math.floor(Math.random() * 1000));
      return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
    }
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
