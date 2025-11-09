import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiBarChart2 } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const TemplateManagement = () => {
  const { token } = useSelector((state) => state.auth)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState(null)
  const [formData, setFormData] = useState({
    category: 'BOOKING_COORDINATION',
    templateText: '',
    description: '',
    variables: [],
  })

  const categories = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'BOOKING_COORDINATION', label: 'Booking Coordination' },
    { value: 'SERVICE_DISCUSSION', label: 'Service Discussion' },
    { value: 'LOGISTICS', label: 'Logistics' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'SYSTEM', label: 'System Messages' },
  ]

  useEffect(() => {
    fetchTemplates()
    fetchStats()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/templates/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTemplates(response.data.data.templates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/templates/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingTemplate(null)
    setFormData({
      category: 'BOOKING_COORDINATION',
      templateText: '',
      description: '',
      variables: [],
    })
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setIsCreating(false)
    setFormData({
      category: template.category,
      templateText: template.templateText,
      description: template.description || '',
      variables: template.variables || [],
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingTemplate(null)
    setFormData({
      category: 'BOOKING_COORDINATION',
      templateText: '',
      description: '',
      variables: [],
    })
  }

  const extractVariables = (text) => {
    const matches = text.match(/{{(\w+)}}/g)
    if (!matches) {return []}
    return matches.map(match => match.replace(/{{|}}/g, ''))
  }

  const handleTemplateTextChange = (text) => {
    setFormData({
      ...formData,
      templateText: text,
      variables: extractVariables(text),
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.templateText.trim()) {
        toast.error('Template text is required')
        return
      }

      if (editingTemplate) {
        // Update existing template
        await axios.put(
          `${API_URL}/api/templates/admin/${editingTemplate.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        toast.success('Template updated successfully')
      } else {
        // Create new template
        await axios.post(
          `${API_URL}/api/templates/admin`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        toast.success('Template created successfully')
      }

      handleCancel()
      fetchTemplates()
      fetchStats()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(error.response?.data?.error || 'Failed to save template')
    }
  }

  const confirmDelete = async () => {
    if (!deletingTemplateId) {return}

    try {
      await axios.delete(`${API_URL}/api/templates/admin/${deletingTemplateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Template deactivated')
      fetchTemplates()
      fetchStats()
      setDeletingTemplateId(null)
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const filteredTemplates = selectedCategory === 'ALL'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Chat Template Management
            </h1>
            <p className="text-gray-400">
              Manage predefined message templates for the booking platform
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Create Template
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Templates</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalTemplates}
                  </p>
                </div>
                <FiBarChart2 className="text-red-500 text-3xl" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {stats.activeTemplates}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Inactive</p>
                  <p className="text-3xl font-bold text-gray-500 mt-1">
                    {stats.inactiveTemplates}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Categories</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.categoryStats?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingTemplate) && (
          <div className="card mb-8 border-2 border-red-600">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Text
                </label>
                <textarea
                  value={formData.templateText}
                  onChange={(e) => handleTemplateTextChange(e.target.value)}
                  placeholder="Enter template text. Use {{variableName}} for variables"
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Use double curly braces for variables: {'{{time}}, {{date}}, {{location}}'}
                </p>
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Detected Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-600 text-white rounded-full text-sm"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when to use this template"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiSave /> Save Template
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">No templates found</p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`card hover:border-red-600 transition-all ${
                  !template.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium">
                        {template.category.replace(/_/g, ' ')}
                      </span>
                      {!template.isActive && (
                        <span className="px-3 py-1 bg-red-900 text-red-300 rounded-lg text-sm">
                          Inactive
                        </span>
                      )}
                      <span className="text-gray-500 text-sm">
                        Used {template.usageCount} times
                      </span>
                    </div>

                    <p className="text-white text-lg mb-2">
                      {template.templateText}
                    </p>

                    {template.description && (
                      <p className="text-gray-400 text-sm mb-2">
                        {template.description}
                      </p>
                    )}

                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {template.variables.map((variable, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => setDeletingTemplateId(template.id)}
                      className="p-2 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Deactivate template"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTemplateId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Deactivate Template</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to deactivate this template? It will no longer be available for use.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Deactivate
              </button>
              <button
                onClick={() => setDeletingTemplateId(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateManagement
