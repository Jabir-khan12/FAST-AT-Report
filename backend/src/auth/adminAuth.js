const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const tokenStore = new Map();
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function issueToken(username) {
  const token = crypto.randomBytes(24).toString('hex');
  tokenStore.set(token, {
    username,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

function verifyToken(token) {
  if (!token || !tokenStore.has(token)) return false;
  const data = tokenStore.get(token);
  if (!data || Date.now() > data.expiresAt) {
    tokenStore.delete(token);
    return false;
  }
  return true;
}

function revokeToken(token) {
  if (token) tokenStore.delete(token);
}

function parseBearerToken(header) {
  if (!header || typeof header !== 'string') return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requireAdmin(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!verifyToken(token)) {
    return res.status(401).json({ message: 'Unauthorized admin access' });
  }
  return next();
}

function validateCredentials(username, password) {
  const user = String(username || '').trim().toLowerCase();
  const pass = String(password || '').trim();
  const expectedUser = String(ADMIN_USERNAME).trim().toLowerCase();
  const expectedPass = String(ADMIN_PASSWORD).trim();
  return user === expectedUser && pass === expectedPass;
}

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
  parseBearerToken,
  requireAdmin,
  validateCredentials,
};
