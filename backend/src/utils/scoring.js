const { STANDARD_WEIGHTS } = require('../config/assessmentConfig');

function scoreStandard(ratings, weight) {
  const total = ratings.reduce((sum, val) => sum + Number(val || 0), 0);
  const max = ratings.length * 5;
  const normalized = max > 0 ? (total / max) * 100 : 0;
  const weightedScore = normalized * weight;
  return { total, normalized, weightedScore };
}

function calculateScores(payload) {
  const standardScores = {};
  let overallScore = 0;

  Object.keys(STANDARD_WEIGHTS).forEach((key) => {
    const ratings = Array.isArray(payload[key]) ? payload[key] : [];
    const computed = scoreStandard(ratings, STANDARD_WEIGHTS[key]);
    standardScores[key] = computed;
    overallScore += computed.weightedScore;
  });

  return {
    standardScores,
    overallScore: Number(overallScore.toFixed(2)),
  };
}

module.exports = { calculateScores };
