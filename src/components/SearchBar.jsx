import React, { useState } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!loading) {
      onSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for places or enter coordinates (lat, lng)..."
        className="search-input"
        disabled={loading}
      />
      <button type="submit" className="search-button" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}

export default SearchBar

