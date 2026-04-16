import { useState, useEffect } from 'react'
import axios from 'axios'

export default function FormViewer({ token, onBack }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [respondentData, setRespondentData] = useState({ name: '', email: '' })

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await axios.get(`/api/forms/${token}`)
        setForm(res.data)
        window.document.title = res.data.title
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }
    fetchForm()
  }, [token])

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formAnswers = form.questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }))

      await axios.post('/api/responses', {
        formId: form.id,
        respondentName: respondentData.name,
        respondentEmail: respondentData.email,
        answers: formAnswers
      })

      setSubmitted(true)
    } catch (err) {
      alert('Error submitting form: ' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading form...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">Thank You!</h2>
          <p className="text-gray-700 mb-6">Your response has been submitted successfully.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}

          <form onSubmit={handleSubmit}>
            {/* Respondent Info */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={respondentData.name}
                  onChange={(e) => setRespondentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={respondentData.email}
                  onChange={(e) => setRespondentData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Questions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions</h2>
              {form.questions && form.questions.map((question, idx) => (
                <div key={question.id} className="mb-6">
                  <label className="block text-gray-900 font-medium mb-2">
                    {idx + 1}. {question.label}
                    {question.required && <span className="text-red-500">*</span>}
                  </label>

                  {question.type === 'text' && (
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {question.type === 'select' && question.options && (
                    <select
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select an option --</option>
                      {question.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {question.type === 'radio' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((opt, i) => (
                        <label key={i} className="flex items-center">
                          <input
                            type="radio"
                            name={`q${question.id}`}
                            value={opt}
                            checked={answers[question.id] === opt}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            required={question.required}
                            className="mr-3"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((opt, i) => (
                        <label key={i} className="flex items-center">
                          <input
                            type="checkbox"
                            value={opt}
                            checked={(answers[question.id] || '').split(',').includes(opt)}
                            onChange={(e) => {
                              const current = (answers[question.id] || '').split(',').filter(Boolean)
                              if (e.target.checked) {
                                handleAnswerChange(question.id, [...current, opt].join(','))
                              } else {
                                handleAnswerChange(question.id, current.filter(v => v !== opt).join(','))
                              }
                            }}
                            className="mr-3"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'date' && (
                    <input
                      type="date"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition mt-8"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
