import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { generateAssessmentReportPdf } from '../utils/reportPdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard({
  data,
  selectedResponse,
  onSelectResponse,
  standards,
  standardTitles,
  standardWeightsMap,
  evaluatorFilter,
  fromDate,
  toDate,
  adminUsername,
  onLogout,
  onFilterChange,
  onRefresh,
  lastUpdated,
}) {
  const [activeSection, setActiveSection] = useState('overview');
  const [showOverallSummary, setShowOverallSummary] = useState(false);
  const [exportScope, setExportScope] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const barData = useMemo(() => {
    const labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
    let values = [];
    if (selectedResponse) {
      values = [
        selectedResponse.standardScores?.standard1?.weightedScore || 0,
        selectedResponse.standardScores?.standard2?.weightedScore || 0,
        selectedResponse.standardScores?.standard3?.weightedScore || 0,
        selectedResponse.standardScores?.standard4?.weightedScore || 0,
        selectedResponse.standardScores?.standard5?.weightedScore || 0,
        selectedResponse.standardScores?.standard6?.weightedScore || 0,
        selectedResponse.standardScores?.standard7?.weightedScore || 0,
      ];
    } else {
      values = [
        data.averageScores.standard1,
        data.averageScores.standard2,
        data.averageScores.standard3,
        data.averageScores.standard4,
        data.averageScores.standard5,
        data.averageScores.standard6,
        data.averageScores.standard7,
      ];
    }
    return {
      labels,
      datasets: [
        {
          label: selectedResponse ? 'Selected Evaluator Scores' : 'Average Weighted Score',
          data: values,
          backgroundColor: '#1f6feb',
        },
      ],
    };
  }, [data, selectedResponse]);

  const pieData = useMemo(() => {
    const labels = ['Needs Improvement (1)', 'Fair (2)', 'Satisfactory (3)', 'Good (4)', 'Excellent (5)'];
    let counts = [0, 0, 0, 0, 0];
    if (selectedResponse) {
      // build distribution from selected response ratings
      Object.keys(standards || {}).forEach((key) => {
        const arr = selectedResponse[key] || [];
        arr.forEach((val) => {
          const idx = Number(val) - 1;
          if (idx >= 0 && idx < 5) counts[idx] += 1;
        });
      });
    } else {
      counts = [
        data.ratingDistribution[1] || 0,
        data.ratingDistribution[2] || 0,
        data.ratingDistribution[3] || 0,
        data.ratingDistribution[4] || 0,
        data.ratingDistribution[5] || 0,
      ];
    }
    return {
      labels,
      datasets: [
        {
          label: 'Count',
          data: counts,
          backgroundColor: [
            'rgba(239, 68, 68, 0.85)',   // Red
            'rgba(245, 158, 11, 0.85)',  // Amber
            'rgba(59, 130, 246, 0.85)',  // Blue
            'rgba(16, 185, 129, 0.85)',  // Emerald
            'rgba(5, 150, 105, 0.85)'    // Green
          ],
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    };
  }, [data, selectedResponse, standards]);

  const pieOptions = {
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    maintainAspectRatio: false,
  };

  const pieTotal = (pieData?.datasets?.[0]?.data || []).reduce((sum, value) => sum + Number(value || 0), 0);
  const nonZeroSlices = (pieData?.datasets?.[0]?.data || []).filter((value) => Number(value || 0) > 0).length;

  const standardKeys = Object.keys(standards || {});

  function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildCSVFromResponses(responses) {
    const csvEscape = (value) => {
      const s = value === null || value === undefined ? '' : String(value);
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = ['id', 'evaluatorName', 'institutionName', 'programName', 'date', 'overallScore', 'observations'];
    const questionHeaders = [];
    const suggestionHeaders = [];
    standardKeys.forEach((key) => {
      const questions = standards[key] || [];
      questions.forEach((_, idx) => {
        questionHeaders.push(`${key}_Q${idx + 1}`);
        suggestionHeaders.push(`${key}_Q${idx + 1}_Suggestion`);
      });
    });

    const allHeaders = headers.concat(questionHeaders, suggestionHeaders);
    const rows = [allHeaders.map(csvEscape).join(',')];

    responses.forEach((r) => {
      const base = [
        r.id || r._id || '',
        r.evaluatorName || '',
        r.institutionName || '',
        r.programName || '',
        r.date ? new Date(r.date).toISOString() : '',
        r.overallScore ?? '',
        r.observations || '',
      ];

      const qVals = [];
      const sVals = [];
      standardKeys.forEach((key) => {
        const questions = standards[key] || [];
        const ratings = r[key] || [];
        const suggestions = r.questionSuggestions?.[key] || [];
        for (let i = 0; i < questions.length; i += 1) {
          qVals.push(ratings[i] ?? '');
          sVals.push(suggestions[i] || '');
        }
      });

      rows.push(base.concat(qVals, sVals).map(csvEscape).join(','));
    });

    return rows.join('\n');
  }

  function pdfText(doc, text, x, y, options = {}) {
    const size = options.size || 10;
    const style = options.style || 'normal';
    doc.setFontSize(size);
    try { doc.setFont(undefined, style); } catch (e) {}
    doc.text(String(text), x, y);
  }

  function sanitizeForFileName(value, fallback = 'report') {
    return String(value || fallback)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80) || fallback;
  }

  function getRowsForExport() {
    if (exportScope === 'selected') {
      return selectedResponse ? [selectedResponse] : [];
    }
    return data.responses || [];
  }

  function getExportBaseName() {
    const datePart = new Date().toISOString().slice(0, 10);
    if (exportScope === 'selected' && selectedResponse) {
      return `response_${sanitizeForFileName(selectedResponse.evaluatorName, 'selected')}_${datePart}`;
    }
    return `responses_all_${datePart}`;
  }

  function pdfWriteWrapped(doc, text, x, y, maxWidth, lineHeight = 13) {
    const lines = doc.splitTextToSize(String(text), maxWidth);
    lines.forEach((line) => {
      doc.text(line, x, y.value);
      y.value += lineHeight;
    });
  }

  function addPageIfNeeded(doc, y, threshold = 760) {
    if (y.value > threshold) {
      doc.addPage();
      y.value = 40;
    }
  }

  function handleDownloadPdfAll(rows) {
    return generateAssessmentReportPdf({
      scope: exportScope,
      responses: rows,
      selectedResponse,
      standardTitles,
      standards,
      standardWeightsMap,
    });
  }

  function handleDownloadPdfDetailedSelected(row) {
    return generateAssessmentReportPdf({
      scope: 'selected',
      responses: [row],
      selectedResponse: row,
      standardTitles,
      standards,
      standardWeightsMap,
    });
  }

  async function handleExport() {
    const rows = getRowsForExport();
    if (!rows.length) return;

    if (exportFormat === 'csv') {
      const csv = buildCSVFromResponses(rows);
      downloadCSV(`${getExportBaseName()}.csv`, csv);
      return;
    }

    if (exportScope === 'selected' && rows[0]) {
      const doc = await handleDownloadPdfDetailedSelected(rows[0]);
      doc.save(`${getExportBaseName()}.pdf`);
      return;
    }

    const doc = await handleDownloadPdfAll(rows);
    doc.save(`${getExportBaseName()}.pdf`);
  }

  async function handleExportSelectedFromDetail() {
    if (!selectedResponse) return;
    const rows = [selectedResponse];

    if (exportFormat === 'csv') {
      const csv = buildCSVFromResponses(rows);
      const datePart = new Date().toISOString().slice(0, 10);
      const base = sanitizeForFileName(selectedResponse.evaluatorName, 'selected');
      downloadCSV(`response_${base}_${datePart}.csv`, csv);
      return;
    }

    const doc = await handleDownloadPdfDetailedSelected(selectedResponse);
    const datePart = new Date().toISOString().slice(0, 10);
    const base = sanitizeForFileName(selectedResponse.evaluatorName, 'selected');
    doc.save(`response_${base}_${datePart}.pdf`);
  }

  return (
    <div className="dashboard-grid">
      <section className="card admin-topbar">
        <h3>Admin Panel</h3>
        <div className="admin-user-actions">
          <span>Signed in as: <strong>{adminUsername}</strong></span>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </section>

      <section className="card nav-card">
        <div className="nav-pills">
          <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>Overview</button>
          <button className={activeSection === 'responses' ? 'active' : ''} onClick={() => setActiveSection('responses')}>Responses</button>
          <button className={activeSection === 'questions' ? 'active' : ''} onClick={() => setActiveSection('questions')}>Question-wise Answers</button>
          <button className={activeSection === 'observations' ? 'active' : ''} onClick={() => setActiveSection('observations')}>Observations & Findings</button>
          {selectedResponse && (
            <button className={activeSection === 'evaluator' ? 'active' : ''} onClick={() => setActiveSection('evaluator')}>Evaluator Detail</button>
          )}
        </div>
      </section>

      <section className="card filter-card">
        <h3>Admin Filters</h3>
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search evaluator"
            value={evaluatorFilter}
            onChange={(e) => onFilterChange('evaluator', e.target.value)}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFilterChange('from', e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => onFilterChange('to', e.target.value)}
          />
          <button type="button" onClick={onRefresh}>Refresh</button>
        </div>
      </section>

      {activeSection === 'overview' && (
        <>
          <section className="card">
            <h3>Standards Performance</h3>
            <Bar data={barData} />
          </section>

          <section className="card pie-card">
            <h3>Rating Distribution</h3>
            <div className="chart-container-pie">
               <Pie data={pieData} options={pieOptions} height={350} />
            </div>
            {pieTotal > 0 && nonZeroSlices <= 1 && (
              <p className="chart-note">Only one rating category exists in this filtered data, so one dominant color is expected.</p>
            )}
          </section>

          <section className="card">
            <h3>Summary</h3>
            <div className="summary-grid">
              <p>Total Responses: <strong>{data.responses.length}</strong></p>
              <p>Average Overall Score: <strong>{data.averageScores.overall}</strong></p>
              <p>Cumulative Overall Score: <strong>{data.cumulativeScores?.overall || 0}</strong></p>
              <p>Last Updated: <strong>{lastUpdated || 'N/A'}</strong></p>
            </div>
          </section>
        </>
      )}

      {activeSection === 'responses' && (
        <section className="card table-card">
          <h3>Submitted Responses</h3>
          <div className="responses-actions">
            <button type="button" onClick={() => setShowOverallSummary(!showOverallSummary)}>{showOverallSummary ? 'Show List' : 'Show Overall Summary'}</button>
            <div className="export-controls">
              <select value={exportScope} onChange={(e) => setExportScope(e.target.value)}>
                <option value="all">All Responses</option>
                <option value="selected" disabled={!selectedResponse}>Selected Evaluator</option>
              </select>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button type="button" onClick={handleExport} disabled={exportScope === 'selected' && !selectedResponse}>
                Download {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
          {showOverallSummary ? (
            <div className="card overall-summary">
              <h4>Overall Responses Summary</h4>
              <div className="summary-grid">
                <p>Total Responses: <strong>{data.responses.length}</strong></p>
                <p>Average Overall Score: <strong>{data.averageScores.overall}</strong></p>
                <p>Average Per-Standard:</p>
                <ul>
                  <li>S1: {data.averageScores.standard1}</li>
                  <li>S2: {data.averageScores.standard2}</li>
                  <li>S3: {data.averageScores.standard3}</li>
                  <li>S4: {data.averageScores.standard4}</li>
                  <li>S5: {data.averageScores.standard5}</li>
                  <li>S6: {data.averageScores.standard6}</li>
                  <li>S7: {data.averageScores.standard7}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Evaluator</th>
                    <th>Institution</th>
                    <th>Program</th>
                    <th>Date</th>
                    <th>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.responses.map((r) => (
                    <tr
                      key={r.id || r._id}
                      className={(selectedResponse && (selectedResponse.id || selectedResponse._id) === (r.id || r._id)) ? 'row-selected' : ''}
                      onClick={() => { onSelectResponse(r); setActiveSection('evaluator'); }}
                    >
                      <td>{r.evaluatorName}</td>
                      <td>{r.institutionName}</td>
                      <td>{r.programName}</td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td>{r.overallScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === 'evaluator' && (
        <section className="card selected-detail-card">
          <h3>Evaluator Detail</h3>
          <div className="detail-export-row">
            <div className="export-controls">
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button type="button" onClick={handleExportSelectedFromDetail} disabled={!selectedResponse}>
                Download This Evaluator
              </button>
            </div>
          </div>
          {!selectedResponse ? (
            <p>Select a person from the table to view full details.</p>
          ) : (
          <>
            <div className="selected-grid">
              <p><strong>Evaluator:</strong> {selectedResponse.evaluatorName}</p>
              <p><strong>Institution:</strong> {selectedResponse.institutionName}</p>
              <p><strong>Program:</strong> {selectedResponse.programName}</p>
              <p><strong>Date:</strong> {new Date(selectedResponse.date).toLocaleDateString()}</p>
              <p><strong>Overall Score:</strong> {selectedResponse.overallScore}</p>
              <p><strong>S1 Weighted:</strong> {Number(selectedResponse.standardScores?.standard1?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S2 Weighted:</strong> {Number(selectedResponse.standardScores?.standard2?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S3 Weighted:</strong> {Number(selectedResponse.standardScores?.standard3?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S4 Weighted:</strong> {Number(selectedResponse.standardScores?.standard4?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S5 Weighted:</strong> {Number(selectedResponse.standardScores?.standard5?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S6 Weighted:</strong> {Number(selectedResponse.standardScores?.standard6?.weightedScore || 0).toFixed(2)}</p>
              <p><strong>S7 Weighted:</strong> {Number(selectedResponse.standardScores?.standard7?.weightedScore || 0).toFixed(2)}</p>
              <div className="full-width">
                <strong>Observations:</strong>
                <p>{selectedResponse.observations || 'No observations provided.'}</p>
              </div>
            </div>

            <div className="full-width detailed-answers-wrap">
              <h4>Question-wise Answers</h4>
              {standardKeys.map((key) => (
                <div key={key} className="standard-answer-block">
                  <h5>{standardTitles[key]}</h5>
                  {(standards[key] || []).map((question, idx) => {
                    const rating = selectedResponse[key]?.[idx] ?? '-';
                    const suggestion = selectedResponse.questionSuggestions?.[key]?.[idx] || '';
                    return (
                      <div key={`${key}-${idx}`} className="answer-item">
                        <p><strong>Q{idx + 1}:</strong> {question}</p>
                        <p><strong>Rating:</strong> {rating}</p>
                        <p><strong>Suggestion:</strong> {suggestion || 'No suggestion provided'}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
          )}
        </section>
      )}

      {activeSection === 'questions' && (
        <section className="card selected-detail-card">
          <h3>Question-wise Answers</h3>
          {!selectedResponse ? (
            <p>Select a person from the Responses tab to view question-wise answers.</p>
          ) : (
            <div className="full-width detailed-answers-wrap">
              {standardKeys.map((key) => (
                <div key={key} className="standard-answer-block">
                  <h5>{standardTitles[key]}</h5>
                  {(standards[key] || []).map((question, idx) => {
                    const rating = selectedResponse[key]?.[idx] ?? '-';
                    const suggestion = selectedResponse.questionSuggestions?.[key]?.[idx] || '';
                    return (
                      <div key={`${key}-${idx}`} className="answer-item">
                        <p><strong>Q{idx + 1}:</strong> {question}</p>
                        <p><strong>Rating:</strong> {rating}</p>
                        <p><strong>Suggestion:</strong> {suggestion || 'No suggestion provided'}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === 'observations' && (
        <section className="card observations-card">
          <h3>Observations & Findings</h3>
          <ul>
            {data.observations.map((item) => (
              <li key={item.id}>
                <strong>{item.evaluatorName}</strong> ({new Date(item.date).toLocaleDateString()}): {item.observations}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
