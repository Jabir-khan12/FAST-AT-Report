import fs from 'fs';
import path from 'path';

// Simple in-memory store for Vercel
let responses = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ message: 'No submission data' });
    }

    const submission = {
      id: Date.now().toString(),
      ...payload,
      submittedAt: new Date().toISOString(),
    };

    responses.push(submission);

    // Calculate scores (simple average)
    const scores = [
      payload.standard1,
      payload.standard2,
      payload.standard3,
      payload.standard4,
      payload.standard5,
      payload.standard6,
      payload.standard7,
    ]
      .filter(Boolean)
      .flat();

    const overallScore =
      scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    return res.json({
      success: true,
      overallScore,
      message: 'Assessment submitted successfully.',
    });
  }

  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Return all responses (in production, filter by user)
    return res.json({
      responses,
      averageScores: {},
      cumulativeScores: {},
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      observations: [],
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
