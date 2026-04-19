const express = require('express');
const Session = require('../models/Session');
const Question = require('../models/Question');

const router = express.Router();

// A simple middleware just to ensure we have a simulated user
// We'll trust the userId passed in the body or header for now since it's an MVP,
// but in a real app, we'd use the verifyToken middleware.
const verifyToken = require('./auth').verifyToken; // we'd need to export verifyToken from auth.js if we wanted it,
// but to make things simple, we'll assume the front-end sends 'Authorization' header.

// Generate random 6-character alphanumerical code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/session - Create a new session
router.post('/', async (req, res) => {
  try {
    const { professorId, title } = req.body;
    let joinCode = generateCode();
    
    // Ensure uniqueness
    while (await Session.findOne({ joinCode })) {
      joinCode = generateCode();
    }

    const session = new Session({
      title: title || 'Live Challenge',
      professorId,
      joinCode
    });

    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session', details: err.message });
  }
});

// GET /api/session/:code - Join via code
router.get('/:code', async (req, res) => {
  try {
    const session = await Session.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ error: 'Session not found or invalid code' });

    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find session', details: err.message });
  }
});

module.exports = router;
