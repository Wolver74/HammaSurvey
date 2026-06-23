const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const passkeyMiddleware = require('../middleware/passkey');

// Submit survey (public)
router.post('/', async (req, res) => {
  console.log('[POST /api/responses] body keys:', Object.keys(req.body || {}));
  try {
    const response = new Response(req.body);
    await response.save();
    console.log('[POST /api/responses] saved OK, id:', response._id);
    res.status(201).json({ message: 'Réponse enregistrée avec succès.' });
  } catch (err) {
    console.error('[POST /api/responses] error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get all responses (protected)
router.get('/', passkeyMiddleware, async (req, res) => {
  console.log('[GET /api/responses] passkey OK, fetching...');
  try {
    const responses = await Response.find().sort({ submittedAt: -1 });
    console.log('[GET /api/responses] returning', responses.length, 'docs');
    res.json(responses);
  } catch (err) {
    console.error('[GET /api/responses] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a response (protected)
router.delete('/:id', passkeyMiddleware, async (req, res) => {
  console.log('[DELETE /api/responses]', req.params.id);
  try {
    await Response.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé.' });
  } catch (err) {
    console.error('[DELETE /api/responses] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
