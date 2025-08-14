import { useState } from 'react'
import { FiCamera, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import mobileService from '../../services/mobileService'

const MobilePhotoUpload = ({ onPhotoTaken, className = '', buttonText = 'Take Photo' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const handleTakePhoto = async () => {
    setIsLoading(true)
    try {
      const photoDataUrl = await mobileService.takePhoto()
      setPreview(photoDataUrl)
      if (onPhotoTaken) {
        onPhotoTaken(photoDataUrl)
      }
      // Add haptic feedback
      mobileService.vibrate(50)
    } catch (error) {
      console.error('Photo capture error:', error)
      toast.error(`Failed to take photo: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        setPreview(dataUrl)
        if (onPhotoTaken) {
          onPhotoTaken(dataUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  if (mobileService.isMobile()) {
    // Native mobile interface
    return (
      <div className={`mobile-photo-upload ${className}`}>
        {preview && (
          <div className="photo-preview mb-4">
            <img 
              src={preview} 
              alt="Captured" 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <button
          onClick={handleTakePhoto}
          disabled={isLoading}
          className="flex items-center justify-center w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <FiCamera className="w-5 h-5 mr-2" />
          )}
          {isLoading ? 'Taking Photo...' : buttonText}
        </button>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Tap to open camera or select from gallery
        </p>
      </div>
    )
  } else {
    // Web fallback interface
    return (
      <div className={`web-photo-upload ${className}`}>
        {preview && (
          <div className="photo-preview mb-4">
            <img 
              src={preview} 
              alt="Selected" 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <label className="flex items-center justify-center w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer transition-colors">
          <FiUpload className="w-5 h-5 mr-2" />
          {buttonText}
          <input
            type="file"
            accept="image/*"
            onChange={handleWebUpload}
            className="hidden"
          />
        </label>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Click to select a photo from your device
        </p>
      </div>
    )
  }
}

export default MobilePhotoUpload