import React, { useState } from 'react'
import SearchBar from './components/SearchBar'
import ResultList from './components/ResultList'
import MapDisplay from './components/MapDisplay'
import './App.css'

function App() {
  const [searchResults, setSearchResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (query) => {
    console.log('[App] handleSearch called with query:', query)
    
    if (!query.trim()) {
      console.warn('[App] Empty query provided')
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults([])
    setSelectedResult(null)

    try {
      console.log('[App] Sending request to backend:', 'http://localhost:8000/chat')
      console.log('[App] Request body:', { message: query })
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      })

      console.log('[App] Response status:', response.status)
      console.log('[App] Response ok:', response.ok)

      const data = await response.json()
      console.log('[App] Response data:', data)

      if (!response.ok) {
        console.error('[App] Response not ok:', data)
        throw new Error(data.error || 'Search failed')
      }

      if (data.success && data.data.predictions) {
        console.log('[App] Predictions received:', data.data.predictions.length)
        setSearchResults(data.data.predictions)
        if (data.data.predictions.length > 0) {
          console.log('[App] Setting first result as selected:', data.data.predictions[0])
          setSelectedResult(data.data.predictions[0])
        }
      } else {
        console.warn('[App] No predictions in response')
        setSearchResults([])
      }
    } catch (err) {
      console.error('[App] Search error:', err)
      console.error('[App] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      setError(err.message || 'Failed to search places')
      setSearchResults([])
    } finally {
      setLoading(false)
      console.log('[App] Search completed, loading set to false')
    }
  }

  const handleSelectResult = (result) => {
    setSelectedResult(result)
  }

  return (
    <div className="app">
      <div className="search-panel">
        <h1>Ola Maps Search</h1>
        <SearchBar onSearch={handleSearch} loading={loading} />
        {error && <div className="error-message">{error}</div>}
        <ResultList
          results={searchResults}
          selectedResult={selectedResult}
          onSelectResult={handleSelectResult}
          loading={loading}
        />
      </div>
      <div className="map-panel">
        <MapDisplay selectedResult={selectedResult} />
      </div>
    </div>
  )
}

export default App

