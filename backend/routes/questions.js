const express = require('express');
const Question = require('../models/Question');

const router = express.Router();

// POST /api/questions - Save a new question to the bank
router.post('/', async (req, res) => {
  try {
    const {
      professorId, text, questionType,
      options, correctOptionId, points, timeLimitSecs
    } = req.body;

    if (!professorId || !text || !questionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Essay questions don't need correctOptionId
    if (questionType !== 'essay' && !correctOptionId) {
      return res.status(400).json({ error: 'correctOptionId is required for non-essay questions' });
    }

    const question = new Question({
      professorId,
      text,
      questionType,
      options: questionType === 'essay' ? [] : options,
      correctOptionId: questionType === 'essay' ? null : correctOptionId,
      points,
      timeLimitSecs,
    });

    await question.save();
    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save question', details: err.message });
  }
});

// GET /api/questions/:professorId - Get question bank
router.get('/:professorId', async (req, res) => {
  try {
    const questions = await Question.find({ professorId: req.params.professorId }).sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions', details: err.message });
  }
});

module.exports = router;
