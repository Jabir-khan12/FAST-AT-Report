import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminDashboard({ onBack }) {
  const [view, setView] = useState('forms') // forms, create, responses
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedForm, setSelectedForm] = useState(null)
  const [responses, setResponses] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [{ label: '', type: 'text', options: [], required: false }]
  })

  // Fetch all forms
  useEffect(() => {
    if (view === 'forms') {
      const fetchForms = async () => {
        try {
          const res = await axios.get('/api/forms')
          setForms(res.data)
        } catch (err) {
          setError('Failed to load forms')
        } finally {
          setLoading(false)
        }
      }
      fetchForms()
    }
  }, [view])

  // Fetch responses for selected form
  useEffect(() => {
    if (selectedForm && view === 'responses') {
      const fetchResponses = async () => {
        try {
          const res = await axios.get(`/api/responses/form/${selectedForm.id}`)
          setResponses(res.data)
        } catch (err) {
          console.error('Failed to load responses:', err)
        }
      }
      fetchResponses()
    }
  }, [selectedForm, view])

  const handleCreateForm = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/forms', formData)
      alert(`Form created! Share this link:\n\n${window.location.origin}/?form=${res.data.token}`)
      setFormData({
        title: '',
        description: '',
        questions: [{ label: '', type: 'text', options: [], required: false }]
      })
      setView('forms')
    } catch (err) {
      alert('Error creating form: ' + err.message)
    }
  }

  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { label: '', type: 'text', options: [], required: false }]
    }))
  }

  const handleUpdateQuestion = (idx, field, value) => {
    const updated = [...formData.questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  const handleAddOption = (idx) => {
    const updated = [...formData.questions]
    updated[idx].options = [...(updated[idx].options || []), '']
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  const handleUpdateOption = (qIdx, oIdx, value) => {
    const updated = [...formData.questions]
    updated[qIdx].options[oIdx] = value
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  const handleRemoveQuestion = (idx) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }))
  }

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`/api/responses/export/${selectedForm.id}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedForm.title}-responses.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      alert('Error exporting CSV: ' + err.message)
    }
  }

  const copyToClipboard = (token) => {
    const url = `${window.location.origin}/?form=${token}`
    navigator.clipboard.writeText(url)
    alert('Form link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
          <button
            onClick={() => setView('forms')}
            className={`py-4 font-semibold border-b-2 transition ${
              view === 'forms'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            My Forms
          </button>
          <button
            onClick={() => setView('create')}
            className={`py-4 font-semibold border-b-2 transition ${
              view === 'create'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Create Form
          </button>
          {selectedForm && (
            <button
              onClick={() => setView('responses')}
              className={`py-4 font-semibold border-b-2 transition ${
                view === 'responses'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Responses ({responses.length})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Forms List */}
        {view === 'forms' && (
          <div>
            {loading ? (
              <div className="text-center text-gray-600">Loading forms...</div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : forms.length === 0 ? (
              <div className="text-center text-gray-600">
                <p className="mb-4">No forms created yet.</p>
                <button
                  onClick={() => setView('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Create Your First Form
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {forms.map(form => (
                  <div key={form.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{form.title}</h3>
                        <p className="text-gray-600 mt-1">{form.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Created: {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(form.token)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForm(form)
                            setView('responses')
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          View Responses
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Form */}
        {view === 'create' && (
          <div className="max-w-2xl">
            <form onSubmit={handleCreateForm} className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Form</h2>

              {/* Form Title */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Form Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Event Feedback"
                />
              </div>

              {/* Form Description */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for the form"
                />
              </div>

              {/* Questions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
                {formData.questions.map((question, idx) => (
                  <div key={idx} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">Question {idx + 1}</h4>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Question Label */}
                    <div className="mb-3">
                      <label className="block text-gray-700 font-medium mb-1">Question</label>
                      <input
                        type="text"
                        value={question.label}
                        onChange={(e) => handleUpdateQuestion(idx, 'label', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter question text"
                      />
                    </div>

                    {/* Question Type */}
                    <div className="mb-3">
                      <label className="block text-gray-700 font-medium mb-1">Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    {/* Options for select/radio/checkbox */}
                    {['select', 'radio', 'checkbox'].includes(question.type) && (
                      <div className="mb-3">
                        <label className="block text-gray-700 font-medium mb-2">Options</label>
                        {(question.options || []).map((opt, oIdx) => (
                          <input
                            key={oIdx}
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(idx)}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-2"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}

                    {/* Required Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                        className="mr-2"
                        id={`required-${idx}`}
                      />
                      <label htmlFor={`required-${idx}`} className="text-gray-700 font-medium">
                        Required
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                >
                  + Add Question
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Create Form
              </button>
            </form>
          </div>
        )}

        {/* Responses */}
        {view === 'responses' && selectedForm && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedForm.title} - Responses</h2>
              <button
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Export as CSV
              </button>
            </div>

            {responses.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                No responses yet
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">{response.respondent_name}</p>
                      <p className="text-gray-600 text-sm">{response.respondent_email}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(response.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {response.answers && response.answers.map((ans, idx) => (
                        <div key={idx}>
                          <p className="font-medium text-gray-900">{ans.label}</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{ans.answer || '(no answer)'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
