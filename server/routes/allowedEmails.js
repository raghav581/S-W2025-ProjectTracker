const express = require('express');
const { superAdminAuth } = require('../middleware/auth');
const AllowedEmail = require('../models/AllowedEmail');
const router = express.Router();

// Get all allowed emails
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const list = await AllowedEmail.find().sort({ email: 1 });
    res.json(list);
  } catch (error) {
    console.error('Get allowed emails error:', error);
    res.status(500).json({ error: 'Server error fetching allowed emails' });
  }
});

// Add allowed email
router.post('/', superAdminAuth, async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const name = (req.body.name || '').trim();
    const urn = (req.body.urn || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!urn) {
      return res.status(400).json({ error: 'URN is required' });
    }
    if (!email.endsWith('@adypu.edu.in')) {
      return res.status(400).json({ error: 'Only @adypu.edu.in emails can be added to allowlist' });
    }
    const created = await AllowedEmail.create({ email, name, urn });
    res.status(201).json(created);
  } catch (error) {
    console.error('Add allowed email error:', error);
    if (error && (error.code === 11000 || (error.message || '').includes('duplicate key'))) {
      return res.status(400).json({ error: 'Email or URN already in allowlist' });
    }
    res.status(500).json({ error: 'Server error adding allowed email' });
  }
});

// Remove allowed email by id or email
router.delete('/', superAdminAuth, async (req, res) => {
  try {
    const id = req.query.id;
    const email = (req.query.email || '').toLowerCase().trim();
    let result;
    if (id) {
      result = await AllowedEmail.findByIdAndDelete(id);
    } else if (email) {
      result = await AllowedEmail.findOneAndDelete({ email });
    } else {
      return res.status(400).json({ error: 'Provide id or email to delete' });
    }
    if (!result) {
      return res.status(404).json({ error: 'Allowlist entry not found' });
    }
    res.json({ message: 'Removed from allowlist' });
  } catch (error) {
    console.error('Delete allowed email error:', error);
    res.status(500).json({ error: 'Server error deleting allowed email' });
  }
});

module.exports = router;


