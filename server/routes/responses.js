const express = require('express');
const { db } = require('../db');

const router = express.Router();

// Submit form response
router.post('/', (req, res) => {
  const { formId, respondentName, respondentEmail, answers } = req.body;

  db.run(
    'INSERT INTO responses (form_id, respondent_name, respondent_email) VALUES (?, ?, ?)',
    [formId, respondentName, respondentEmail],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const responseId = this.lastID;

      // Insert answers
      let inserted = 0;
      answers.forEach((ans) => {
        db.run(
          'INSERT INTO response_answers (response_id, question_id, answer) VALUES (?, ?, ?)',
          [responseId, ans.questionId, ans.answer],
          (err) => {
            if (err) console.error('Error inserting answer:', err);
            inserted++;
            if (inserted === answers.length) {
              res.json({ id: responseId, message: 'Response submitted successfully' });
            }
          }
        );
      });

      if (answers.length === 0) {
        res.json({ id: responseId, message: 'Response submitted successfully' });
      }
    }
  );
});

// Get all responses for a form
router.get('/form/:formId', (req, res) => {
  const { formId } = req.params;

  db.all(
    `SELECT r.id, r.respondent_name, r.respondent_email, r.submitted_at
     FROM responses r
     WHERE r.form_id = ?
     ORDER BY r.submitted_at DESC`,
    [formId],
    (err, responses) => {
      if (err) return res.status(500).json({ error: err.message });

      // Fetch answers for each response
      let processed = 0;
      const result = responses.map(r => ({ ...r, answers: [] }));

      if (result.length === 0) {
        return res.json(result);
      }

      result.forEach((response, idx) => {
        db.all(
          `SELECT ra.question_id, q.label, ra.answer
           FROM response_answers ra
           JOIN questions q ON ra.question_id = q.id
           WHERE ra.response_id = ?`,
          [response.id],
          (err, answers) => {
            if (err) console.error('Error fetching answers:', err);
            result[idx].answers = answers || [];
            processed++;
            if (processed === result.length) {
              res.json(result);
            }
          }
        );
      });
    }
  );
});

// Export responses as CSV
router.get('/export/:formId', (req, res) => {
  const { formId } = req.params;

  db.all(
    `SELECT q.id, q.label FROM questions WHERE form_id = ? ORDER BY q.order_index`,
    [formId],
    (err, questions) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        `SELECT r.id, r.respondent_name, r.respondent_email, r.submitted_at
         FROM responses r
         WHERE r.form_id = ?
         ORDER BY r.submitted_at DESC`,
        [formId],
        (err, responses) => {
          if (err) return res.status(500).json({ error: err.message });

          // Build CSV header
          let csv = 'Respondent Name,Email,Submitted At';
          questions.forEach(q => {
            csv += `,${q.label.replace(/,/g, ';')}`;
          });
          csv += '\n';

          // Add rows
          let processed = 0;
          responses.forEach((response) => {
            db.all(
              `SELECT question_id, answer FROM response_answers WHERE response_id = ?`,
              [response.id],
              (err, answers) => {
                if (err) console.error('Error fetching answers:', err);

                const answerMap = {};
                (answers || []).forEach(a => {
                  answerMap[a.question_id] = a.answer;
                });

                csv += `"${response.respondent_name || ''}","${response.respondent_email || ''}","${response.submitted_at}"`;
                questions.forEach(q => {
                  const ans = answerMap[q.id] || '';
                  csv += `,${typeof ans === 'string' ? '"' + ans.replace(/"/g, '""') + '"' : ''}`;
                });
                csv += '\n';

                processed++;
                if (processed === responses.length) {
                  res.setHeader('Content-Type', 'text/csv');
                  res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
                  res.send(csv);
                }
              }
            );
          });

          if (responses.length === 0) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
            res.send(csv);
          }
        }
      );
    }
  );
});

module.exports = router;
