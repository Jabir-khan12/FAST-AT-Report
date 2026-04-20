import { useEffect, useMemo, useState } from 'react';
import StandardSection from './components/StandardSection';
import AdminDashboard from './components/AdminDashboard';
import { defaultStandards, standardWeights as defaultStandardWeights } from './data/defaultStandards';

const standardTitles = {
  standard1: 'Standard 1 - Program Mission, Objectives and Outcomes',
  standard2: 'Standard 2 - Curriculum Design and Organization',
  standard3: 'Standard 3 - Subject Specific Facilities',
  standard4: 'Standard 4 - Student Advising and Counselling',
  standard5: 'Standard 5 - Teaching Faculty/Staff',
  standard6: 'Standard 6 - Institutional Policies and Process Control',
  standard7: 'Standard 7 - Institutional Support and Facilities',
};

const rubricRows = [
  { score: 1, description: 'Poor performance in most of the areas.' },
  { score: 2, description: 'Fair performance in most of the areas.' },
  { score: 3, description: 'Good performance for most areas. No poor performance in any areas.' },
  { score: 4, description: 'Good to excellent performance in all areas.' },
  { score: 5, description: 'Excellent performance in most of the areas.' },
];

function makeInitialRatings(standards) {
  return Object.fromEntries(
    Object.entries(standards).map(([key, arr]) => [key, Array(arr.length).fill('')])
  );
}

function makeInitialSuggestions(standards) {
  return Object.fromEntries(
    Object.entries(standards).map(([key, arr]) => [key, Array(arr.length).fill('')])
  );
}

const emptyDashboard = {
  responses: [],
  averageScores: {
    standard1: 0,
    standard2: 0,
    standard3: 0,
    standard4: 0,
    standard5: 0,
    standard6: 0,
    standard7: 0,
    overall: 0,
  },
  cumulativeScores: {
    standard1: 0,
    standard2: 0,
    standard3: 0,
    standard4: 0,
    standard5: 0,
    standard6: 0,
    standard7: 0,
    overall: 0,
  },
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  observations: [],
};

export default function App() {
  const [mode, setMode] = useState('form');
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [adminUsername, setAdminUsername] = useState(() => sessionStorage.getItem('adminUsername') || '');
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [standards, setStandards] = useState(defaultStandards);
  const [standardWeightsMap, setStandardWeightsMap] = useState(defaultStandardWeights);
  const [ratings, setRatings] = useState(makeInitialRatings(defaultStandards));
  const [questionSuggestions, setQuestionSuggestions] = useState(makeInitialSuggestions(defaultStandards));
  const [formInfo, setFormInfo] = useState({
    evaluatorName: '',
    institutionName: '',
    programName: '',
    date: '',
    observations: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitToast, setSubmitToast] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [filters, setFilters] = useState({ evaluator: '', from: '', to: '' });

  const standardKeys = useMemo(() => Object.keys(standards), [standards]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        if (!res.ok) return;
        const data = await res.json();
        if (data.standards) {
          setStandards(data.standards);
          setRatings(makeInitialRatings(data.standards));
          setQuestionSuggestions(makeInitialSuggestions(data.standards));
        }
        if (data.weights && typeof data.weights === 'object') {
          setStandardWeightsMap((prev) => ({ ...prev, ...data.weights }));
        }
      } catch (e) {
        // keep default fallback
      }
    }
    loadMeta();
  }, []);

    // Clear stale session storage on app load (after credential updates)
    useEffect(() => {
      const clearStaleSession = () => {
        const storedUsername = sessionStorage.getItem('adminUsername');
        // If session has old credentials, clear it to force re-login
        if (storedUsername && storedUsername !== 'qecfast') {
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminUsername');
          setAdminToken('');
          setAdminUsername('');
        }
      };
      clearStaleSession();
    }, []);

  async function fetchDashboard(authToken = adminToken) {
    const query = new URLSearchParams();
    if (filters.evaluator) query.set('evaluator', filters.evaluator);
    if (filters.from) query.set('from', filters.from);
    if (filters.to) query.set('to', filters.to);

    const res = await fetch(`/api/responses?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (res.status === 401) {
      setAdminError('Session expired. Please login again.');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUsername');
      setAdminToken('');
      setAdminUsername('');
      setDashboard(emptyDashboard);
      setSelectedResponse(null);
      return;
    }
    const data = await res.json();
    setDashboard(data);
    setLastUpdated(new Date().toLocaleString());
    setSelectedResponse((prev) => {
      if (!data.responses?.length) return null;
      if (!prev) return data.responses[0];
      return data.responses.find((item) => (item.id || item._id) === (prev.id || prev._id)) || data.responses[0];
    });
  }

  useEffect(() => {
    if (mode === 'admin' && adminToken) {
      fetchDashboard().catch(() => {
        setError('Failed to load dashboard');
      });
    }
  }, [mode, adminToken]);

  async function handleAdminLogin(e) {
    e.preventDefault();
    setAdminError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.message || 'Login failed');
        return;
      }

      setAdminToken(data.token);
      setAdminUsername(data.username);
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUsername', data.username);
      setAdminForm({ username: '', password: '' });
      await fetchDashboard(data.token);
    } catch {
      setAdminError('Unable to login right now.');
    }
  }

  async function handleAdminLogout() {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      }
    } catch {
      // ignore logout network error and force local sign-out
    }

    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUsername');
    setAdminToken('');
    setAdminUsername('');
    setSelectedResponse(null);
    setDashboard(emptyDashboard);
    setMode('form');
  }

  function setRating(standardKey, index, value) {
    setRatings((prev) => {
      const copy = { ...prev };
      copy[standardKey] = [...copy[standardKey]];
      copy[standardKey][index] = value;
      return copy;
    });
  }

  function setSuggestion(standardKey, index, text) {
    setQuestionSuggestions((prev) => {
      const copy = { ...prev };
      copy[standardKey] = [...copy[standardKey]];
      copy[standardKey][index] = text;
      return copy;
    });
  }

  function allAnswered() {
    return standardKeys.every((key) => ratings[key].every((v) => String(v) !== ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (
      !formInfo.evaluatorName.trim() ||
      !formInfo.institutionName.trim() ||
      !formInfo.programName.trim() ||
      !formInfo.date ||
      !formInfo.observations.trim()
    ) {
      setError('Please fill all required fields, including observations.');
      return;
    }

    if (!allAnswered()) {
      setError('Please answer all rating questions before submitting.');
      return;
    }

    const payload = {
      ...formInfo,
      ...Object.fromEntries(
        standardKeys.map((key) => [key, ratings[key].map((v) => Number(v))])
      ),
      questionSuggestions,
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Submission failed');
        return;
      }
      setMessage(`Submitted successfully. Overall Score: ${data.overallScore}`);
      setSubmitToast('Assessment submitted successfully. Thank you.');
      setTimeout(() => setSubmitToast(''), 4000);
      setRatings(makeInitialRatings(standards));
      setQuestionSuggestions(makeInitialSuggestions(standards));
      setFormInfo({
        evaluatorName: '',
        institutionName: '',
        programName: '',
        date: '',
        observations: '',
      });
    } catch (err) {
      setError('Could not connect to server.');
    }
  }

  return (
    <div className="page">
      {submitToast ? <div className="success-toast">{submitToast}</div> : null}
      <header className="hero">
        <div className="hero-inner">
          <img
            src="/fast-uni-logo.jpeg"
            alt="FAST National University logo"
          />
          <div>
            <h1>Assessment Team Evaluation Form</h1>
            <p>
              FAST National University QEC Assessment Team Report for Standards 1 to 7.
              Please evaluate each item using the official 1 to 5 rating rubric.
            </p>
          </div>
        </div>
        <div className="mode-switch">
          <button type="button" onClick={() => setMode('form')} className={mode === 'form' ? 'active' : ''}>User Form</button>
          <button type="button" onClick={() => setMode('admin')} className={mode === 'admin' ? 'active' : ''}>Admin Dashboard</button>
        </div>
      </header>

      {mode === 'form' ? (
        <main className="main-wrap">
          <form className="card" onSubmit={handleSubmit}>
            <h2>Evaluator Information</h2>
            <div className="grid-2">
              <label>
                Evaluator Name
                <input
                  required
                  type="text"
                  value={formInfo.evaluatorName}
                  onChange={(e) => setFormInfo((p) => ({ ...p, evaluatorName: e.target.value }))}
                />
              </label>
              <label>
                Institution Name
                <input
                  required
                  type="text"
                  value={formInfo.institutionName}
                  onChange={(e) => setFormInfo((p) => ({ ...p, institutionName: e.target.value }))}
                />
              </label>
              <label>
                Program Name
                <input
                  required
                  type="text"
                  value={formInfo.programName}
                  onChange={(e) => setFormInfo((p) => ({ ...p, programName: e.target.value }))}
                />
              </label>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={formInfo.date}
                  onChange={(e) => setFormInfo((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
            </div>
          </form>

          <section className="card rubric-card">
            <h2>Rubric for Assessment Team</h2>
            <p>Use the following scale for all standards and questions before submitting the assessment.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Performance Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rubricRows.map((row) => (
                    <tr key={row.score}>
                      <td>{row.score}</td>
                      <td>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {standardKeys.map((key) => (
            <StandardSection
              key={key}
              standardKey={key}
              title={standardTitles[key]}
              weight={standardWeightsMap[key]}
              questions={standards[key]}
              values={ratings[key]}
              suggestions={questionSuggestions[key]}
              onSetValue={(index, value) => setRating(key, index, value)}
              onSetSuggestion={(index, text) => setSuggestion(key, index, text)}
            />
          ))}

          <section className="card">
            <h3>Observations / Findings</h3>
            <textarea
              required
              rows={6}
              placeholder="Enter findings, strengths, gaps, recommendations..."
              value={formInfo.observations}
              onChange={(e) => setFormInfo((p) => ({ ...p, observations: e.target.value }))}
            />
            {error ? <p className="error">{error}</p> : null}
            {message ? <p className="success">{message}</p> : null}
            <button type="button" className="submit-btn" onClick={handleSubmit}>Submit Assessment</button>
          </section>
        </main>
      ) : (
        <main className="main-wrap">
          {!adminToken ? (
            <section className="card admin-login-card">
              <h2>Admin Access</h2>
              <p>Only authorized admin users can view evaluator results.</p>
              <form onSubmit={handleAdminLogin}>
                <label>
                  Username
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={(e) => setAdminForm((p) => ({ ...p, username: e.target.value }))}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    value={adminForm.password}
                    onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </label>
                {adminError ? <p className="error">{adminError}</p> : null}
                <button type="submit" className="submit-btn">Login as Admin</button>
              </form>
              {/* Default credentials removed for security - configured via backend env */}
            </section>
          ) : (
            <AdminDashboard
              data={dashboard}
              selectedResponse={selectedResponse}
              onSelectResponse={setSelectedResponse}
              standards={standards}
              standardTitles={standardTitles}
              standardWeightsMap={standardWeightsMap}
              evaluatorFilter={filters.evaluator}
              fromDate={filters.from}
              toDate={filters.to}
              adminUsername={adminUsername}
              lastUpdated={lastUpdated}
              onLogout={handleAdminLogout}
              onFilterChange={(key, val) => {
                if (key === 'evaluator') setFilters((p) => ({ ...p, evaluator: val }));
                if (key === 'from') setFilters((p) => ({ ...p, from: val }));
                if (key === 'to') setFilters((p) => ({ ...p, to: val }));
              }}
              onRefresh={() => fetchDashboard().catch(() => setError('Failed to refresh dashboard'))}
            />
          )}
        </main>
      )}
    </div>
  );
}
