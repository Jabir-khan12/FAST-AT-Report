const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');

const router = express.Router();

// Generate unique token for form
const generateToken = () => crypto.randomBytes(16).toString('hex');

// Create a new form
router.post('/', (req, res) => {
  const { title, description, questions } = req.body;
  const token = generateToken();

  db.run(
    'INSERT INTO forms (title, description, token) VALUES (?, ?, ?)',
    [title, description, token],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const formId = this.lastID;

      // Insert questions
      let inserted = 0;
      questions.forEach((q, idx) => {
        const options = q.options ? JSON.stringify(q.options) : null;
        db.run(
          'INSERT INTO questions (form_id, label, type, options, required, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [formId, q.label, q.type, options, q.required ? 1 : 0, idx],
          (err) => {
            if (err) console.error('Error inserting question:', err);
            inserted++;
            if (inserted === questions.length) {
              res.json({ id: formId, token, message: 'Form created successfully' });
            }
          }
        );
      });

      if (questions.length === 0) {
        res.json({ id: formId, token, message: 'Form created successfully' });
      }
    }
  );
});

// Get form by token (public)
router.get('/:token', (req, res) => {
  const { token } = req.params;
  db.get('SELECT * FROM forms WHERE token = ?', [token], (err, form) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!form) return res.status(404).json({ error: 'Form not found' });

    db.all('SELECT id, label, type, options, required FROM questions WHERE form_id = ? ORDER BY order_index', [form.id], (err, questions) => {
      if (err) return res.status(500).json({ error: err.message });

      const parsedQuestions = questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      }));

      res.json({ ...form, questions: parsedQuestions });
    });
  });
});

// Get all forms (admin)
router.get('/', (req, res) => {
  db.all('SELECT id, title, description, token, created_at FROM forms ORDER BY created_at DESC', (err, forms) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(forms);
  });
});

module.exports = router;
