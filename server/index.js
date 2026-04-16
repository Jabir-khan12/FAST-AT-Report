const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const formsRouter = require('./routes/forms');
const responsesRouter = require('./routes/responses');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.init();

// Routes
app.use('/api/forms', formsRouter);
app.use('/api/responses', responsesRouter);

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Fallback to React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
