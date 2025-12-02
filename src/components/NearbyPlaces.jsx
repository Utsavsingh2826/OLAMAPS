import React from 'react'
import './NearbyPlaces.css'

function NearbyPlaces({ nearbyPlaces, loading, onClose, selectedLocation }) {
  if (!nearbyPlaces && !loading) {
    return null
  }

  // Helper function to calculate distance
  const calculateDistance = (placeLat, placeLng) => {
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      return null
    }
    
    // Validate coordinates
    if (!placeLat || !placeLng || isNaN(placeLat) || isNaN(placeLng)) {
      return null
    }
    
    try {
      const R = 6371e3 // Earth radius in meters
      const φ1 = selectedLocation.lat * Math.PI / 180
      const φ2 = placeLat * Math.PI / 180
      const Δφ = (placeLat - selectedLocation.lat) * Math.PI / 180
      const Δλ = (placeLng - selectedLocation.lng) * Math.PI / 180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      const distance = R * c // Distance in meters
      
      if (isNaN(distance) || !isFinite(distance)) {
        return null
      }
      
      if (distance < 1000) {
        return `${Math.round(distance)} m`
      }
      return `${(distance / 1000).toFixed(1)} km`
    } catch (error) {
      console.warn('[NearbyPlaces] Error calculating distance:', error)
      return null
    }
  }
  
  // Helper function to format distance from meters
  const formatDistanceFromMeters = (meters) => {
    if (!meters || isNaN(meters) || !isFinite(meters)) {
      return null
    }
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }

  // Helper function to format category name
  const formatCategoryName = (category) => {
    const names = {
      amenities: 'Amenities',
      connectivity: 'Connectivity',
      shopping: 'Shopping',
      services: 'Services'
    }
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  // Helper function to get place type icon/name
  const getPlaceType = (types) => {
    if (!types || types.length === 0) return 'Place'
    
    const typeMap = {
      'amenity:restaurant': 'Restaurant',
      'amenity:cafe': 'Cafe',
      'amenity:atm': 'ATM',
      'amenity:hospital': 'Hospital',
      'amenity:pharmacy': 'Pharmacy',
      'amenity:bank': 'Bank',
      'transit_station': 'Transit',
      'bus_station': 'Bus Station',
      'subway_station': 'Metro',
      'train_station': 'Train Station',
      'shopping_mall': 'Mall',
      'store': 'Store',
      'gas_station': 'Gas Station',
      'parking': 'Parking',
      'lodging': 'Hotel'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }
    return types[0].replace(/amenity:|_/g, ' ').trim() || 'Place'
  }

  // Helper to get numeric distance for sorting
  const getNumericDistance = (place) => {
    // Prefer distance_meters from API if available
    if (place.distance_meters !== undefined && place.distance_meters !== null) {
      return place.distance_meters
    }
    
    // Otherwise calculate from coordinates
    if (selectedLocation) {
      const lat = place.geometry?.location?.lat || place.structured_formatting?.geometry?.location?.lat || place.location?.lat
      const lng = place.geometry?.location?.lng || place.structured_formatting?.geometry?.location?.lng || place.location?.lng
      
      if (lat && lng) {
        const R = 6371e3 // Earth radius in meters
        const φ1 = selectedLocation.lat * Math.PI / 180
        const φ2 = lat * Math.PI / 180
        const Δφ = (lat - selectedLocation.lat) * Math.PI / 180
        const Δλ = (lng - selectedLocation.lng) * Math.PI / 180

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

        return R * c // Distance in meters
      }
    }
    
    return 999999 // Default to very large number if can't calculate
  }

  // Sort places by distance within each category
  const sortPlacesByDistance = (places) => {
    return [...places].sort((a, b) => {
      const distA = getNumericDistance(a)
      const distB = getNumericDistance(b)
      return distA - distB
    })
  }

  return (
    <div className="nearby-places-overlay" onClick={onClose}>
      <div className="nearby-places-panel" onClick={(e) => e.stopPropagation()}>
        <div className="nearby-places-header">
          <h2>Nearby Places</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading ? (
          <div className="nearby-places-loading">
            <div className="loading-spinner"></div>
            <p>Finding nearby places...</p>
          </div>
        ) : nearbyPlaces && Object.keys(nearbyPlaces).length > 0 ? (
          <div className="nearby-places-content">
            {Object.entries(nearbyPlaces).map(([category, places]) => {
              const sortedPlaces = sortPlacesByDistance(places)
              return (
                <div key={category} className="category-section">
                  <h3 className="category-header">
                    {formatCategoryName(category)}
                    <span className="category-count">({sortedPlaces.length})</span>
                  </h3>
                  <div className="places-grid">
                    {sortedPlaces.map((place, index) => {
                      // Handle different possible data structures
                      const placeLat = place.geometry?.location?.lat || 
                                     (place.structured_formatting?.geometry?.location?.lat) ||
                                     (place.location?.lat)
                      const placeLng = place.geometry?.location?.lng || 
                                     (place.structured_formatting?.geometry?.location?.lng) ||
                                     (place.location?.lng)
                      
                      // Calculate distance - prefer API distance_meters, fallback to calculation
                      let distanceDisplay = null
                      const distanceMeters = place.distance_meters
                      
                      if (distanceMeters !== undefined && distanceMeters !== null && !isNaN(distanceMeters)) {
                        distanceDisplay = formatDistanceFromMeters(distanceMeters)
                      } else if (placeLat && placeLng) {
                        distanceDisplay = calculateDistance(placeLat, placeLng)
                      }
                      
                      const rating = place.rating
                      const openingHours = place.opening_hours
                      
                      // Only show opening hours if we have valid data
                      // Check if opening_hours exists and has meaningful data
                      let showOpeningHours = false
                      let openNow = undefined
                      
                      if (openingHours) {
                        // Check if we have actual schedule data (not just empty object)
                        const hasScheduleData = (openingHours.periods && openingHours.periods.length > 0) ||
                                               (openingHours.weekday_text && openingHours.weekday_text.length > 0)
                        
                        // Only show if we have schedule data AND open_now is explicitly set (not null/undefined)
                        if (hasScheduleData && openingHours.open_now !== undefined && openingHours.open_now !== null) {
                          showOpeningHours = true
                          openNow = openingHours.open_now === true
                        }
                      }
                      
                      const name = place.structured_formatting?.main_text || place.name || 'Unknown Place'
                      const address = place.structured_formatting?.secondary_text || place.description || ''
                      const photoUrl = place.photo_url

                      return (
                        <div key={place.place_id || index} className="place-card">
                          {photoUrl ? (
                            <div className="place-photo">
                              <img 
                                src={photoUrl} 
                                alt={name}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                              <div className="place-photo-placeholder" style={{ display: 'none' }}>
                                <span>{name.charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="place-photo-placeholder">
                              <span>{name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          
                          <div className="place-info">
                            <div className="place-header">
                              <h4 className="place-name">{name}</h4>
                              {distanceDisplay && (
                                <span className="place-distance">{distanceDisplay}</span>
                              )}
                            </div>
                            
                            <p className="place-address">{address}</p>
                            
                            <div className="place-meta">
                              {rating !== undefined && rating !== null && rating > 0 && (
                                <div className="place-rating">
                                  <span className="rating-stars">
                                    {'★'.repeat(Math.round(rating))}
                                    {'☆'.repeat(5 - Math.round(rating))}
                                  </span>
                                  <span className="rating-value">{rating.toFixed(1)}</span>
                                </div>
                              )}
                              
                              {showOpeningHours && (
                                <span className={`open-status ${openNow ? 'open' : 'closed'}`}>
                                  {openNow ? 'Open Now' : 'Closed'}
                                </span>
                              )}
                            </div>

                            <div className="place-badges">
                              {place.parking_available && (
                                <span className="badge">Parking</span>
                              )}
                              {place.wheelchair_accessibility && (
                                <span className="badge">Wheelchair Accessible</span>
                              )}
                              {place.types && place.types.length > 0 && (
                                <span className="badge badge-type">
                                  {getPlaceType(place.types)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="nearby-places-empty">
            <p>No nearby places found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NearbyPlaces

