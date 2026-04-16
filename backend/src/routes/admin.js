const express = require('express');
const {
  issueToken,
  revokeToken,
  parseBearerToken,
  verifyToken,
  validateCredentials,
} = require('../auth/adminAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!validateCredentials(username, password)) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = issueToken(username);
  return res.json({ token, username });
});

router.get('/verify', (req, res) => {
  const token = parseBearerToken(req.headers.authorization);
  if (!verifyToken(token)) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  return res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  const token = parseBearerToken(req.headers.authorization);
  revokeToken(token);
  return res.json({ ok: true });
});

module.exports = router;
