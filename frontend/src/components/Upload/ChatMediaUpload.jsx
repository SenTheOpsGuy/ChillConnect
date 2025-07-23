import { useState, useRef } from 'react'
import { FiPaperclip, FiImage, FiX, FiSend } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ChatMediaUpload = ({ bookingId, onMediaUpload, disabled = false }) => {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  }

  const handleFileSelect = (file) => {
    if (!file) return

    // Validate file type
    if (!allowedTypes[file.type]) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 10MB.')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('media', selectedFile)
      formData.append('bookingId', bookingId)

      const response = await api.post('/upload/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const mediaUrl = response.data.data.url
        onMediaUpload?.(mediaUrl)
        
        // Reset form
        setSelectedFile(null)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        toast.success('Media uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="relative">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload media"
      >
        <FiPaperclip className="w-5 h-5" />
      </button>

      {/* Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Media
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-4">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatMediaUpload