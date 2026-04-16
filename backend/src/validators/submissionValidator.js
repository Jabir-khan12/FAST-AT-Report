const { STANDARD_QUESTIONS } = require('../config/assessmentConfig');

function validRatings(ratings, expectedLength) {
  if (!Array.isArray(ratings) || ratings.length !== expectedLength) return false;
  return ratings.every((r) => Number.isInteger(Number(r)) && Number(r) >= 1 && Number(r) <= 5);
}

function validSuggestions(payload, standardQuestions) {
  if (!payload.questionSuggestions) return true;
  if (typeof payload.questionSuggestions !== 'object' || Array.isArray(payload.questionSuggestions)) return false;

  for (const [standardKey, questions] of Object.entries(standardQuestions)) {
    const suggestions = payload.questionSuggestions[standardKey];
    if (suggestions === undefined) continue;

    if (!Array.isArray(suggestions) || suggestions.length !== questions.length) {
      return false;
    }

    if (!suggestions.every((s) => typeof s === 'string')) {
      return false;
    }
  }

  return true;
}

function validateSubmission(body) {
  const requiredFields = ['evaluatorName', 'institutionName', 'programName', 'date', 'observations'];
  for (const field of requiredFields) {
    if (!body[field] || String(body[field]).trim() === '') {
      return `${field} is required`;
    }
  }

  for (const [standardKey, questions] of Object.entries(STANDARD_QUESTIONS)) {
    if (!validRatings(body[standardKey], questions.length)) {
      return `${standardKey} must contain ${questions.length} ratings between 1 and 5`;
    }
  }

  if (!validSuggestions(body, STANDARD_QUESTIONS)) {
    return 'questionSuggestions must match standard question lengths';
  }

  return null;
}

module.exports = { validateSubmission };
