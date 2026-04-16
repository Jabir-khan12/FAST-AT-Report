export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      standards: {
        standard1: [
          'Standard 1 - Question 1',
          'Standard 1 - Question 2',
          'Standard 1 - Question 3',
        ],
        standard2: [
          'Standard 2 - Question 1',
          'Standard 2 - Question 2',
          'Standard 2 - Question 3',
        ],
        standard3: [
          'Standard 3 - Question 1',
          'Standard 3 - Question 2',
          'Standard 3 - Question 3',
        ],
        standard4: [
          'Standard 4 - Question 1',
          'Standard 4 - Question 2',
          'Standard 4 - Question 3',
        ],
        standard5: [
          'Standard 5 - Question 1',
          'Standard 5 - Question 2',
          'Standard 5 - Question 3',
        ],
        standard6: [
          'Standard 6 - Question 1',
          'Standard 6 - Question 2',
          'Standard 6 - Question 3',
        ],
        standard7: [
          'Standard 7 - Question 1',
          'Standard 7 - Question 2',
          'Standard 7 - Question 3',
        ],
      },
      weights: {
        standard1: 1,
        standard2: 1,
        standard3: 1,
        standard4: 1,
        standard5: 1,
        standard6: 1,
        standard7: 1,
      },
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
