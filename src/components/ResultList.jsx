import React from 'react'
import './ResultList.css'

function ResultList({ results, selectedResult, onSelectResult, loading }) {
  if (loading) {
    return (
      <div className="result-list">
        <div className="loading">Searching...</div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="result-list">
        <div className="empty-state">No results found. Try searching for a place.</div>
      </div>
    )
  }

  return (
    <div className="result-list">
      <div className="results-header">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </div>
      {results.map((result, index) => (
        <div
          key={result.place_id || index}
          className={`result-item ${
            selectedResult?.place_id === result.place_id ? 'active' : ''
          }`}
          onClick={() => onSelectResult(result)}
        >
          <div className="result-main">
            {result.structured_formatting.main_text}
          </div>
          <div className="result-secondary">
            {result.structured_formatting.secondary_text}
          </div>
          {result.types && result.types.length > 0 && (
            <div className="result-types">
              {result.types.slice(0, 2).map((type, i) => (
                <span key={i} className="type-badge">
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ResultList

