import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FiCamera, FiUpload, FiX } from 'react-icons/fi'
import { updateUser } from '../../store/slices/authSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ProfilePhotoUpload = ({ currentPhoto, onPhotoUpdate, size = 'lg' }) => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }

  const handleFileSelect = (file) => {
    if (!file) {return}

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 10MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await api.post('/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        const photoUrl = response.data.data.url
        
        // Update user profile in Redux
        dispatch(updateUser({
          profile: {
            ...user.profile,
            profilePhoto: photoUrl,
          },
        }))

        // Notify parent component
        onPhotoUpdate?.(photoUrl)

        toast.success('Profile photo updated successfully!')
        setPreview(null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload photo')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragOut = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemovePreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = () => {
    if (!user?.profile?.firstName && !user?.profile?.lastName) {return 'U'}
    return `${user.profile.firstName?.charAt(0) || ''}${user.profile.lastName?.charAt(0) || ''}`
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Photo Display */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center relative ${
            dragActive ? 'border-primary-500 bg-primary-50' : ''
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="spinner w-6 h-6 border-white"></div>
            </div>
          )}
          
          {preview || currentPhoto ? (
            <img
              src={preview || currentPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-2xl font-semibold">
              {getInitials()}
            </div>
          )}
          
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer">
            <FiCamera className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Preview controls */}
        {preview && (
          <div className="absolute -top-2 -right-2 flex space-x-1">
            <button
              onClick={handleRemovePreview}
              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload button overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 cursor-pointer"
        >
          <span className="sr-only">Upload photo</span>
        </button>
      </div>

      {/* Upload area */}
      <div className="text-center">
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drop your photo here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary-600 hover:text-primary-500 font-medium"
              disabled={uploading}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            JPEG, PNG, GIF, or WebP • Max 10MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Status */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="spinner w-4 h-4"></div>
          <span>Uploading...</span>
        </div>
      )}
    </div>
  )
}

export default ProfilePhotoUpload