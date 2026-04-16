import { useState, useEffect } from 'react'
import AdminDashboard from './pages/AdminDashboard'
import FormViewer from './pages/FormViewer'

function App() {
  const [page, setPage] = useState('home')
  const [formToken, setFormToken] = useState(null)

  // Check URL for form token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('form')
    if (token) {
      setFormToken(token)
      setPage('form')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {page === 'home' && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Visitor Form</h1>
            <p className="text-gray-600 mb-6">Collect data from your visitors with ease</p>
            
            <button
              onClick={() => setPage('admin')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4 transition"
            >
              Admin Dashboard
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Have a form link? Paste it:
              </label>
              <input
                type="text"
                placeholder="Paste the form URL or token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    setFormToken(e.target.value)
                    setPage('form')
                  }
                }}
                id="tokenInput"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('tokenInput')
                  if (input.value) {
                    setFormToken(input.value)
                    setPage('form')
                  }
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Submit Form
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'admin' && (
        <AdminDashboard onBack={() => setPage('home')} />
      )}

      {page === 'form' && formToken && (
        <FormViewer token={formToken} onBack={() => setPage('home')} />
      )}
    </div>
  )
}

export default App
