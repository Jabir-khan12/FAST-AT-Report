const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const responseRoutes = require('./routes/responses');
const adminRoutes = require('./routes/admin');
const { STANDARD_QUESTIONS, STANDARD_WEIGHTS } = require('./config/assessmentConfig');
const { ensureStore } = require('./store/localStore');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

ensureStore();

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'QEC Assessment backend is running. Use /api/meta, /api/submit, and /api/responses.',
  });
});

app.get('/api/meta', (req, res) => {
  res.json({
    standards: STANDARD_QUESTIONS,
    weights: STANDARD_WEIGHTS,
  });
});

app.use('/api', responseRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start backend:', err.message);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  process.exit(0);
});
