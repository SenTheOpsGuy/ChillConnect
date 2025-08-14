import { useState } from 'react'
import { FiMapPin, FiNavigation } from 'react-icons/fi'
import mobileService from '../../services/mobileService'

const LocationPicker = ({ onLocationSelected, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [manualAddress, setManualAddress] = useState('')

  const getCurrentLocation = async () => {
    setIsLoading(true)
    try {
      const position = await mobileService.getCurrentPosition()
      const location = {
        latitude: position.latitude,
        longitude: position.longitude,
        address: `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`,
      }
      setCurrentLocation(location)
      
      // Reverse geocode to get human-readable address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.longitude},${position.latitude}.json?access_token=${process.env.VITE_MAPBOX_TOKEN}&types=address`,
        )
        if (response.ok) {
          const data = await response.json()
          if (data.features && data.features.length > 0) {
            location.address = data.features[0].place_name
          }
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, using coordinates')
      }
      
      setCurrentLocation(location)
      if (onLocationSelected) {
        onLocationSelected(location)
      }
      
      // Haptic feedback
      mobileService.vibrate(50)
    } catch (error) {
      console.error('Location error:', error)
      console.error(`Failed to get location: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualAddress = () => {
    if (manualAddress.trim()) {
      const location = {
        address: manualAddress.trim(),
        latitude: null,
        longitude: null,
        manual: true,
      }
      if (onLocationSelected) {
        onLocationSelected(location)
      }
    }
  }

  return (
    <div className={`location-picker ${className}`}>
      <div className="space-y-4">
        {/* Current Location Button */}
        <button
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <FiNavigation className="w-5 h-5 mr-2" />
          )}
          {isLoading ? 'Getting Location...' : 'Use Current Location'}
        </button>

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FiMapPin className="w-4 h-4 text-gray-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Current Location:</p>
                <p className="text-sm text-gray-600">{currentLocation.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Manual Address Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter Address Manually
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your address..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleManualAddress}
              disabled={!manualAddress.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Set
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center">
          {mobileService.isMobile() 
            ? 'We need location access to find nearby services'
            : 'Location services help us show you nearby providers'
          }
        </p>
      </div>
    </div>
  )
}

export default LocationPicker