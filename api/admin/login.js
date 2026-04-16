import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'qecfast';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qecfast@112';

// In-memory token store for serverless
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

function validateCredentials(username, password) {
  const user = String(username || '').trim().toLowerCase();
  const pass = String(password || '').trim();
  const expectedUser = String(ADMIN_USERNAME).trim().toLowerCase();
  const expectedPass = String(ADMIN_PASSWORD).trim();
  return user === expectedUser && pass === expectedPass;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!validateCredentials(username, password)) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = issueToken(username);
  return res.json({ token, username });
}
