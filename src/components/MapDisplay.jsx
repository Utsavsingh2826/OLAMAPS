import React, { useEffect, useRef, useState } from 'react'
import './MapDisplay.css'

const API_KEY = 'rvReGRfyYJaYCo4FEPtklkoQ4DlYdnhfpoqsytwU'

function MapDisplay({ selectedResult }) {
  const mapContainer = useRef(null)
  const mapInstance = useRef(null)
  const olaMapsInstance = useRef(null)
  const markerRef = useRef(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)

  // Function to initialize map
  const initMap = React.useCallback(() => {
    console.log('[MapDisplay] initMap called')
    console.log('[MapDisplay] mapContainer.current:', mapContainer.current)
    console.log('[MapDisplay] mapInstance.current:', mapInstance.current)
    
    // If already initialized, skip
    if (mapInstance.current || mapInitialized) {
      console.log('[MapDisplay] Map already initialized, skipping')
      return
    }

    // If container not ready, cannot initialize
    if (!mapContainer.current) {
      console.warn('[MapDisplay] Map container not available, cannot initialize')
      return
    }
      // Check if OlaMaps is available (from CDN)
      // The UMD build might expose it as window.OlaMaps or window.olamaps
      let OlaMapsClass = null
      
      if (typeof window !== 'undefined') {
        // Try different possible global names
        OlaMapsClass = window.OlaMaps || window.olamaps || window.Olamaps
        
        // Also check if it's nested (e.g., window.OlaMaps.OlaMaps)
        if (!OlaMapsClass && window.OlaMaps && window.OlaMaps.OlaMaps) {
          OlaMapsClass = window.OlaMaps.OlaMaps
        }
      }
      
      if (!OlaMapsClass) {
        console.error('[MapDisplay] OlaMaps SDK not found!')
        console.log('[MapDisplay] window.OlaMaps:', window.OlaMaps)
        console.log('[MapDisplay] window.olamaps:', window.olamaps)
        console.log('[MapDisplay] Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('ola')))
        console.log('[MapDisplay] All window properties (first 50):', Object.keys(window).slice(0, 50))
        setError('Ola Maps SDK not loaded. Please check the console for details.')
        return false
      }

      console.log('[MapDisplay] OlaMaps SDK found:', OlaMapsClass)
      console.log('[MapDisplay] SDK type:', typeof OlaMapsClass)
      console.log('[MapDisplay] SDK constructor:', OlaMapsClass.name || 'Anonymous')
      console.log('[MapDisplay] Initializing map with API key:', API_KEY ? 'Present' : 'Missing')

      try {
        const OlaMaps = OlaMapsClass
        console.log('[MapDisplay] Creating OlaMaps instance...')
        
        const olaMaps = new OlaMaps({
          apiKey: API_KEY,
        })

        olaMapsInstance.current = olaMaps
        console.log('[MapDisplay] OlaMaps instance created:', olaMaps)

        console.log('[MapDisplay] Calling init with config:', {
          style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
          container: mapContainer.current,
          center: [72.82535371370518,18.966990084336576],
          zoom: 12,
        })

        const myMap = olaMaps.init({
          style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
          container: mapContainer.current,
          center: [72.82535371370518,18.966990084336576],
          zoom: 12,
        })
 
        // // Add center marker to show initial position
        // olaMaps
        //   .addMarker({ offset: [0, -25], anchor: 'bottom' })
        //   .setLngLat([72.82535371370518,18.966990084336576])
        //   .addTo(myMap)

        console.log('[MapDisplay] Map initialized successfully:', myMap)
        console.log('[MapDisplay] Map methods available:', Object.keys(myMap || {}))

        mapInstance.current = myMap
        setMapInitialized(true)
        setError(null)
        
        // Add event listeners for debugging
        if (myMap && myMap.on) {
          myMap.on('load', () => {
            console.log('[MapDisplay] Map loaded event fired')
            // Hide loading overlay when map loads
            setMapInitialized(true)
          })
          myMap.on('error', (e) => {
            const errorMsg = e.error?.message || 'Unknown error'
            console.error('[MapDisplay] Map error event:', e)
            // Only show critical errors, ignore style layer warnings
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('Source layer')) {
              console.warn('[MapDisplay] Non-critical map error (ignored):', errorMsg)
            } else {
              console.warn('[MapDisplay] Style layer warning (ignored):', errorMsg)
            }
          })
        }
        return true
      } catch (error) {
        console.error('[MapDisplay] Error initializing map:', error)
        console.error('[MapDisplay] Error stack:', error.stack)
        console.error('[MapDisplay] Error details:', {
          message: error.message,
          name: error.name,
          cause: error.cause
        })
        setError(`Failed to initialize map: ${error.message}`)
        setMapInitialized(false)
        return false
      }
  }, [mapInitialized])

  // Helper to check if SDK is available
  const isSDKAvailable = React.useCallback(() => {
    if (typeof window === 'undefined') return false
    return !!(window.OlaMaps || window.olamaps || window.Olamaps || 
              (window.OlaMaps && window.OlaMaps.OlaMaps))
  }, [])

  const getMarkerClass = () => {
    if (typeof window === 'undefined') return null
    return (
      window.olamaps?.Marker ||
      window.OlaMaps?.Marker ||
      (window.OlaMaps?.OlaMaps?.Marker) ||
      window.maplibregl?.Marker ||
      null
    )
  }

  const getPopupClass = () => {
    if (typeof window === 'undefined') return null
    return (
      window.olamaps?.Popup ||
      window.OlaMaps?.Popup ||
      (window.OlaMaps?.OlaMaps?.Popup) ||
      window.maplibregl?.Popup ||
      null
    )
  }

  const clearMarker = React.useCallback(() => {
    if (markerRef.current) {
      try {
        markerRef.current.remove()
      } catch (error) {
        console.warn('[MapDisplay] Failed to remove marker:', error)
      }
      markerRef.current = null
    }
  }, [])

  const addMarker = React.useCallback((lat, lng, info) => {
    if (!mapInstance.current) return

    const MarkerClass = getMarkerClass()
    if (!MarkerClass) {
      console.warn('[MapDisplay] Marker class not available yet')
      return
    }

    clearMarker()

    const marker = new MarkerClass({
      color: '#FF642F',
      scale: 1.1
    })

    if (marker.setLngLat) {
      marker.setLngLat([lng, lat])
    } else {
      console.warn('[MapDisplay] Marker does not support setLngLat')
      return
    }

    if (info) {
      const PopupClass = getPopupClass()
      if (PopupClass) {
        const popup = new PopupClass({
          offset: 25,
        }).setHTML(`
          <div class="map-popup">
            <strong>${info.mainText || 'Selected location'}</strong>
            ${info.secondaryText ? `<div>${info.secondaryText}</div>` : ''}
          </div>
        `)

        if (marker.setPopup) {
          marker.setPopup(popup)
        }
      }
    }

    marker.addTo(mapInstance.current)
    markerRef.current = marker
    console.log('[MapDisplay] Marker added at:', { lat, lng })
  }, [clearMarker])

  // Initialize map when container is ready
  useEffect(() => {
    console.log('[MapDisplay] Initialization useEffect triggered')
    console.log('[MapDisplay] mapContainer.current:', mapContainer.current)
    console.log('[MapDisplay] mapInstance.current:', mapInstance.current)
    console.log('[MapDisplay] mapInitialized state:', mapInitialized)
    
    // If already initialized, skip
    if (mapInstance.current) {
      console.log('[MapDisplay] Map already initialized, skipping')
      return
    }

    // If container not ready, wait
    if (!mapContainer.current) {
      console.warn('[MapDisplay] Map container not available yet')
      return
    }

    // Wait for SDK to load if not available immediately
    if (isSDKAvailable()) {
      console.log('[MapDisplay] SDK already available, initializing immediately')
      initMap()
    } else {
      console.log('[MapDisplay] SDK not available, waiting for it to load...')
      // Wait for SDK to load (check every 100ms for up to 5 seconds)
      let attempts = 0
      const maxAttempts = 50
      const checkInterval = setInterval(() => {
        attempts++
        console.log(`[MapDisplay] Checking for SDK (attempt ${attempts}/${maxAttempts})...`)
        
        if (isSDKAvailable()) {
          console.log('[MapDisplay] SDK loaded, initializing map')
          clearInterval(checkInterval)
          initMap()
        } else if (attempts >= maxAttempts) {
          console.error('[MapDisplay] SDK failed to load after maximum attempts')
          clearInterval(checkInterval)
          setError('Ola Maps SDK failed to load. Please check the browser console and network tab.')
        }
      }, 100)
      
      return () => clearInterval(checkInterval)
    }
  }, [mapInitialized, initMap, isSDKAvailable])

  // Update map when selected result changes
  useEffect(() => {
    console.log('[MapDisplay] Selected result changed:', selectedResult)
    console.log('[MapDisplay] Map instance available:', !!mapInstance.current)
    
    if (!selectedResult) {
      console.log('[MapDisplay] No selected result, clearing details')
      setDetails(null)
      clearMarker()
      return
    }

    if (!mapInstance.current) {
      console.warn('[MapDisplay] Map instance not available, cannot update')
      return
    }

    const { lat, lng } = selectedResult.geometry.location
    console.log('[MapDisplay] Updating map to location:', { lat, lng })

    try {
      // Update map center and zoom - Ola Maps SDK uses MapLibre GL JS API
      const map = mapInstance.current
      console.log('[MapDisplay] Map object:', map)
      console.log('[MapDisplay] Available map methods:', Object.keys(map).filter(k => typeof map[k] === 'function'))
      
      // Try different methods that might be available
      if (map.flyTo) {
        console.log('[MapDisplay] Using flyTo method')
        map.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        })
      } else if (map.jumpTo) {
        console.log('[MapDisplay] Using jumpTo method')
        map.jumpTo({
          center: [lng, lat],
          zoom: 15
        })
      } else if (map.setCenter && map.setZoom) {
        console.log('[MapDisplay] Using setCenter and setZoom methods')
        map.setCenter([lng, lat])
        map.setZoom(15)
      } else if (map.easeTo) {
        console.log('[MapDisplay] Using easeTo method')
        map.easeTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        })
      } else {
        console.warn('[MapDisplay] No known method to update map center found')
        console.log('[MapDisplay] Map object structure:', JSON.stringify(Object.keys(map), null, 2))
      }

      // Set details for display
      const info = {
        mainText: selectedResult.structured_formatting.main_text,
        secondaryText: selectedResult.structured_formatting.secondary_text,
        description: selectedResult.description,
        location: { lat, lng },
        placeId: selectedResult.place_id,
        types: selectedResult.types || [],
        reference: selectedResult.reference,
      }
      setDetails(info)
      addMarker(lat, lng, info)
      console.log('[MapDisplay] Details updated successfully')
    } catch (error) {
      console.error('[MapDisplay] Error updating map:', error)
      console.error('[MapDisplay] Error stack:', error.stack)
      setError(`Failed to update map: ${error.message}`)
    }
  }, [selectedResult, addMarker, clearMarker])

  useEffect(() => {
    return () => {
      clearMarker()
    }
  }, [clearMarker])

  // Callback ref to trigger initialization when container mounts
  // MUST be before any conditional returns (Rules of Hooks)
  const containerRef = React.useCallback((el) => {
    console.log('[MapDisplay] Container ref callback, element:', el)
    mapContainer.current = el
    
    if (el && !mapInstance.current && !mapInitialized) {
      console.log('[MapDisplay] Container mounted, will check for SDK and initialize')
      // The useEffect will handle initialization, but we can also try here
      // Small delay to ensure DOM is ready and SDK might be loaded
      setTimeout(() => {
        if (mapContainer.current && !mapInstance.current && !mapInitialized) {
          console.log('[MapDisplay] Triggering initMap from container ref (delayed)')
          // Check SDK first
          if (isSDKAvailable()) {
            initMap()
          }
        }
      }, 100)
    }
  }, [mapInitialized, initMap, isSDKAvailable])

  // Early returns AFTER all hooks
  if (error) {
    return (
      <div className="map-display">
        <div className="map-error">
          <h3>Map Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            setError(null)
            setMapInitialized(false)
            mapInstance.current = null
            olaMapsInstance.current = null
          }}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="map-display">
      {!mapInitialized && (
        <div className="map-loading-overlay">
          <div className="map-loading">
            <p>Loading map...</p>
            <p className="loading-debug">Check browser console for debug logs</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        className="map-container"
      />
      {details && (
        <div className="map-details">
          <h3>{details.mainText}</h3>
          <p className="details-secondary">{details.secondaryText}</p>
          <div className="details-info">
            <div className="info-row">
              <span className="info-label">Coordinates:</span>
              <span className="info-value">
                {details.location.lat.toFixed(6)}, {details.location.lng.toFixed(6)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Place ID:</span>
              <span className="info-value">{details.placeId}</span>
            </div>
            {details.types.length > 0 && (
              <div className="info-row">
                <span className="info-label">Types:</span>
                <span className="info-value">
                  {details.types.map((type) => type.replace(/_/g, ' ')).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {!details && (
        <div className="map-placeholder">
          <p>Search for a place to see it on the map</p>
        </div>
      )}
    </div>
  )
}

export default MapDisplay

