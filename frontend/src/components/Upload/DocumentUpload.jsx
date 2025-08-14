import { useState, useRef } from 'react'
import { 
  FiUpload, FiFile, FiX, FiCheck, FiAlertCircle, 
  FiImage, FiFileText, 
} from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

const DocumentUpload = ({ 
  documentType: initialDocumentType = 'ID', 
  onUploadComplete, 
  maxFiles = 5,
  existingDocuments = [],
}) => {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [documentType, setDocumentType] = useState(initialDocumentType)

  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return <FiImage className="w-6 h-6" />
    } else if (type === 'application/pdf') {
      return <FiFileText className="w-6 h-6" />
    }
    return <FiFile className="w-6 h-6" />
  }

  const validateFiles = (files) => {
    const validFiles = []
    const errors = []

    Array.from(files).forEach(file => {
      // Check file type
      if (!allowedTypes[file.type]) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.`)
        return
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size too large. Maximum size is 10MB.`)
        return
      }

      validFiles.push(file)
    })

    // Check total file count
    if (selectedFiles.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed.`)
      return { validFiles: [], errors }
    }

    return { validFiles, errors }
  }

  const handleFileSelect = (files) => {
    const { validFiles, errors } = validateFiles(files)

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Create previews
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(prev => [...prev, {
            file,
            preview: e.target.result,
            type: 'image',
          }])
        }
        reader.readAsDataURL(file)
      } else {
        setPreviews(prev => [...prev, {
          file,
          preview: null,
          type: 'document',
        }])
      }
    })
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one document')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('documents', file)
      })
      formData.append('documentType', documentType)

      const response = await api.post('/upload/verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast.success('Documents uploaded successfully!')
        onUploadComplete?.(response.data.data)
        
        // Reset form
        setSelectedFiles([])
        setPreviews([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload documents')
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
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleInputChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) {return '0 Bytes'}
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={uploading}
        >
          <option value="ID">Government ID</option>
          <option value="Passport">Passport</option>
          <option value="Driver License">Driver&apos;s License</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Verification Documents
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drop your documents here or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary-600 hover:text-primary-500 font-medium"
            disabled={uploading}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500 mb-4">
          JPEG, PNG, GIF, WebP, or PDF • Max 10MB per file • Up to {maxFiles} files
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          multiple
          disabled={uploading}
        />

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-left">
              <h4 className="text-sm font-medium text-yellow-800">
                Important Requirements
              </h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Document must be clear and readable</li>
                <li>• All corners must be visible</li>
                <li>• No glare or shadows</li>
                <li>• Must be current and valid</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-3">
            {selectedFiles.map((file, index) => {
              const preview = previews.find(p => p.file === file)
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  {preview?.type === 'image' ? (
                    <img
                      src={preview.preview}
                      alt={file.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                    disabled={uploading}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Previously Uploaded Documents
          </h4>
          <div className="space-y-2">
            {existingDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-green-200 rounded flex items-center justify-center">
                  <FiCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {doc.documentType} Document
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {doc.status?.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
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
                <FiUpload className="w-4 h-4" />
                <span>Upload Documents</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload