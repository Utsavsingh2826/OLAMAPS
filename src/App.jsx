import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import ResultList from './components/ResultList'
import MapDisplay from './components/MapDisplay'
import NearbyPlaces from './components/NearbyPlaces'
import './App.css'

function App() {
  const [searchResults, setSearchResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nearbyPlaces, setNearbyPlaces] = useState(null)
  const [nearbyPlacesLoading, setNearbyPlacesLoading] = useState(false)
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)

  // Helper function to parse coordinates from query
  const parseCoordinates = (query) => {
    // Remove extra whitespace and split by comma
    const cleaned = query.trim().replace(/\s+/g, ' ')
    const parts = cleaned.split(',').map(part => part.trim())
    
    if (parts.length !== 2) {
      return null
    }
    
    const first = parseFloat(parts[0])
    const second = parseFloat(parts[1])
    
    // Check if both are valid numbers
    if (isNaN(first) || isNaN(second)) {
      return null
    }
    
    // Determine if it's lat,lng or lng,lat based on value ranges
    // Latitude: -90 to 90, Longitude: -180 to 180
    // If first value is in lat range and second in lng range, use as lat,lng
    // Otherwise, assume lng,lat format
    let lat, lng
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      // Likely lat, lng format
      lat = first
      lng = second
    } else if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
      // Likely lng, lat format
      lng = first
      lat = second
    } else {
      // Default to lat, lng if ranges don't help
      lat = first
      lng = second
    }
    
    // Validate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null
    }
    
    return { lat, lng }
  }

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

    // Check if query is coordinates
    const coords = parseCoordinates(query)
    if (coords) {
      console.log('[App] Detected coordinates:', coords)
      
      // Create a synthetic result object for coordinates
      const syntheticResult = {
        place_id: `coord_${coords.lat}_${coords.lng}`,
        description: `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        structured_formatting: {
          main_text: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
          secondary_text: 'Coordinates'
        },
        geometry: {
          location: {
            lat: coords.lat,
            lng: coords.lng
          }
        },
        types: ['coordinates'],
        reference: `coord_${coords.lat}_${coords.lng}`
      }
      
      setSearchResults([syntheticResult])
      setSelectedResult(syntheticResult)
      setLoading(false)
      return
    }

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

  // Fetch nearby places when toggle is turned on
  const fetchNearbyPlaces = useCallback(async () => {
    if (!selectedResult) {
      setNearbyPlaces(null)
      return
    }

    // Get location from selected result
    const location = selectedResult.geometry?.location
    if (!location || !location.lat || !location.lng) {
      console.warn('[App] Selected result does not have valid location')
      return
    }

    const locationString = `${location.lat},${location.lng}`
    console.log('[App] Fetching nearby places for location:', locationString)

    setNearbyPlacesLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: locationString,
          radius: 1000
        }),
      })

      const data = await response.json()
      console.log('[App] Nearby places response:', data)

      if (response.ok && data.success) {
        setNearbyPlaces(data.data)
      } else {
        console.error('[App] Failed to fetch nearby places:', data.error)
        setNearbyPlaces({})
      }
    } catch (err) {
      console.error('[App] Error fetching nearby places:', err)
      setNearbyPlaces({})
    } finally {
      setNearbyPlacesLoading(false)
    }
  }, [selectedResult])

  // Reset nearby places when selection changes
  useEffect(() => {
    if (!selectedResult) {
      setNearbyPlaces(null)
      setShowNearbyPlaces(false)
    }
  }, [selectedResult])

  // Fetch nearby places when panel is toggled on
  useEffect(() => {
    if (showNearbyPlaces && selectedResult && !nearbyPlaces && !nearbyPlacesLoading) {
      fetchNearbyPlaces()
    }
  }, [showNearbyPlaces, selectedResult, nearbyPlaces, nearbyPlacesLoading, fetchNearbyPlaces])

  const handleCloseNearbyPlaces = () => {
    setShowNearbyPlaces(false)
  }

  const handleToggleNearbyPlaces = () => {
    if (showNearbyPlaces) {
      setShowNearbyPlaces(false)
    } else {
      if (selectedResult) {
        setShowNearbyPlaces(true)
      }
    }
  }

  return (
    <div className="app">
      <div className="search-panel">
        <h1>Ola Maps Search</h1>
        <SearchBar onSearch={handleSearch} loading={loading} />
        {error && <div className="error-message">{error}</div>}
        <button
          className="toggle-nearby-button"
          onClick={handleToggleNearbyPlaces}
          disabled={!selectedResult}
          title={selectedResult ? 'Toggle nearby places' : 'Select a location first'}
        >
          {showNearbyPlaces ? 'Hide' : 'Show'} Nearby Places
        </button>
        <ResultList
          results={searchResults}
          selectedResult={selectedResult}
          onSelectResult={handleSelectResult}
          loading={loading}
        />
      </div>
      <div className="map-panel">
        <MapDisplay selectedResult={selectedResult} />
        {showNearbyPlaces && (
          <NearbyPlaces
            nearbyPlaces={nearbyPlaces}
            loading={nearbyPlacesLoading}
            onClose={handleCloseNearbyPlaces}
            selectedLocation={selectedResult?.geometry?.location}
          />
        )}
      </div>
    </div>
  )
}

export default App

