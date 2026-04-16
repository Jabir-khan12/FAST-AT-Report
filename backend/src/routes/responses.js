const express = require('express');
const { validateSubmission } = require('../validators/submissionValidator');
const { calculateScores } = require('../utils/scoring');
const { addResponse, getResponses } = require('../store/localStore');
const { requireAdmin } = require('../auth/adminAuth');

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const error = validateSubmission(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const scoreData = calculateScores(req.body);
    const payload = {
      ...req.body,
      date: req.body.date,
      ...scoreData,
    };

    const created = addResponse(payload);
    return res.status(201).json({
      message: 'Submission saved successfully',
      id: created.id,
      overallScore: created.overallScore,
    });
  } catch (err) {
    if (err && err.code === 'DUPLICATE') {
      return res.status(409).json({
        message: 'Duplicate submission detected for same evaluator, institution, program and date.',
      });
    }
    return res.status(500).json({ message: 'Server error while saving submission' });
  }
});

router.get('/responses', requireAdmin, async (req, res) => {
  try {
    const { evaluator, from, to } = req.query;
    const responses = getResponses({ evaluator, from, to });

    const totals = {
      standard1: 0,
      standard2: 0,
      standard3: 0,
      standard4: 0,
      standard5: 0,
      standard6: 0,
      standard7: 0,
      overall: 0,
      count: responses.length,
    };

    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    responses.forEach((r) => {
      totals.standard1 += r.standardScores?.standard1?.weightedScore || 0;
      totals.standard2 += r.standardScores?.standard2?.weightedScore || 0;
      totals.standard3 += r.standardScores?.standard3?.weightedScore || 0;
      totals.standard4 += r.standardScores?.standard4?.weightedScore || 0;
      totals.standard5 += r.standardScores?.standard5?.weightedScore || 0;
      totals.standard6 += r.standardScores?.standard6?.weightedScore || 0;
      totals.standard7 += r.standardScores?.standard7?.weightedScore || 0;
      totals.overall += r.overallScore || 0;

      ['standard1', 'standard2', 'standard3', 'standard4', 'standard5', 'standard6', 'standard7'].forEach((key) => {
        (r[key] || []).forEach((val) => {
          if (ratingDist[val] !== undefined) ratingDist[val] += 1;
        });
      });
    });

    const averageScores = totals.count
      ? {
          standard1: Number((totals.standard1 / totals.count).toFixed(2)),
          standard2: Number((totals.standard2 / totals.count).toFixed(2)),
          standard3: Number((totals.standard3 / totals.count).toFixed(2)),
          standard4: Number((totals.standard4 / totals.count).toFixed(2)),
          standard5: Number((totals.standard5 / totals.count).toFixed(2)),
          standard6: Number((totals.standard6 / totals.count).toFixed(2)),
          standard7: Number((totals.standard7 / totals.count).toFixed(2)),
          overall: Number((totals.overall / totals.count).toFixed(2)),
        }
      : {
          standard1: 0,
          standard2: 0,
          standard3: 0,
          standard4: 0,
          standard5: 0,
          standard6: 0,
          standard7: 0,
          overall: 0,
        };

    const observations = responses.map((r) => ({
      id: r.id,
      evaluatorName: r.evaluatorName,
      date: r.date,
      observations: r.observations,
    }));

    const cumulativeScores = {
      standard1: Number(totals.standard1.toFixed(2)),
      standard2: Number(totals.standard2.toFixed(2)),
      standard3: Number(totals.standard3.toFixed(2)),
      standard4: Number(totals.standard4.toFixed(2)),
      standard5: Number(totals.standard5.toFixed(2)),
      standard6: Number(totals.standard6.toFixed(2)),
      standard7: Number(totals.standard7.toFixed(2)),
      overall: Number(totals.overall.toFixed(2)),
    };

    return res.json({
      responses,
      averageScores,
      cumulativeScores,
      ratingDistribution: ratingDist,
      observations,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error while fetching responses' });
  }
});

module.exports = router;
