const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findByUsername, createUser, validatePassword } = require('../models/User');
require('dotenv').config();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (findByUsername(username)) return res.status(409).json({ error: 'Username already exists' });
    const safeRole = role === 'ADMIN' ? 'USER' : (role || 'USER'); // prevent self-admin
    const user = createUser({ username, password, role: safeRole });
    res.status(201).json({ message: 'Account created successfully', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = findByUsername(username);
    if (!user || !validatePassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
