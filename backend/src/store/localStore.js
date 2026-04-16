const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dataFile = path.join(dataDir, 'responses.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ responses: [] }, null, 2), 'utf8');
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataFile, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { responses: parsed };
    }
    return parsed && Array.isArray(parsed.responses) ? parsed : { responses: [] };
  } catch {
    return { responses: [] };
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

function sameSubmission(a, b) {
  return (
    String(a.evaluatorName).trim().toLowerCase() === String(b.evaluatorName).trim().toLowerCase() &&
    String(a.institutionName).trim().toLowerCase() === String(b.institutionName).trim().toLowerCase() &&
    String(a.programName).trim().toLowerCase() === String(b.programName).trim().toLowerCase() &&
    String(a.date).slice(0, 10) === String(b.date).slice(0, 10)
  );
}

function addResponse(payload) {
  const store = readStore();
  const duplicate = store.responses.some((entry) => sameSubmission(entry, payload));

  if (duplicate) {
    const error = new Error('Duplicate submission detected for same evaluator, institution, program and date.');
    error.code = 'DUPLICATE';
    throw error;
  }

  const doc = {
    ...payload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  store.responses.unshift(doc);
  writeStore(store);
  return doc;
}

function getResponses(filter = {}) {
  const store = readStore();
  let results = [...store.responses];

  if (filter.evaluator) {
    const evaluator = filter.evaluator.toLowerCase();
    results = results.filter((item) => item.evaluatorName.toLowerCase().includes(evaluator));
  }

  if (filter.from) {
    const fromDate = new Date(filter.from);
    results = results.filter((item) => new Date(item.date) >= fromDate);
  }

  if (filter.to) {
    const toDate = new Date(filter.to);
    toDate.setHours(23, 59, 59, 999);
    results = results.filter((item) => new Date(item.date) <= toDate);
  }

  return results;
}

module.exports = {
  ensureStore,
  addResponse,
  getResponses,
};
