import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiSearch, FiSend, FiX } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TemplateSelector = ({ token, bookingId, onSend, onClose }) => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'BOOKING_COORDINATION', label: 'Booking', icon: '📅' },
    { key: 'SERVICE_DISCUSSION', label: 'Services', icon: '💼' },
    { key: 'LOGISTICS', label: 'Logistics', icon: '🚗' },
    { key: 'SUPPORT', label: 'Support', icon: '🆘' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/templates/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load message templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Initialize variables with empty values
    if (template.variables && template.variables.length > 0) {
      const initialVars = {};
      template.variables.forEach(varName => {
        initialVars[varName] = '';
      });
      setTemplateVariables(initialVars);
    } else {
      setTemplateVariables({});
    }
  };

  const handleVariableChange = (varName, value) => {
    setTemplateVariables({
      ...templateVariables,
      [varName]: value
    });
  };

  const processTemplate = (template, variables) => {
    let text = template.templateText;
    if (variables && Object.keys(variables).length > 0) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        text = text.replace(regex, variables[key] || '');
      });
    }
    return text;
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a message template');
      return;
    }

    // Validate required variables
    if (selectedTemplate.variables && selectedTemplate.variables.length > 0) {
      const missingVars = selectedTemplate.variables.filter(
        varName => !templateVariables[varName] || !templateVariables[varName].trim()
      );
      if (missingVars.length > 0) {
        toast.error(`Please fill in: ${missingVars.join(', ')}`);
        return;
      }
    }

    try {
      await axios.post(
        `${API_URL}/api/templates/send`,
        {
          bookingId,
          templateId: selectedTemplate.id,
          variables: templateVariables
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Call parent callback
      if (onSend) {
        onSend(processTemplate(selectedTemplate, templateVariables));
      }

      // Reset
      setSelectedTemplate(null);
      setTemplateVariables({});

      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const getFilteredTemplates = () => {
    if (!selectedCategory) return [];

    const categoryTemplates = templates[selectedCategory] || [];

    if (!searchQuery.trim()) return categoryTemplates;

    return categoryTemplates.filter(template =>
      template.templateText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-white">Select Message</h3>
          <p className="text-sm text-gray-400">Choose a predefined message template</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="text-gray-400" size={20} />
          </button>
        )}
      </div>

      {/* Category Selection */}
      {!selectedCategory ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {categories.map(category => {
              const count = templates[category.key]?.length || 0;
              return (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className="p-6 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all transform hover:scale-105 border border-gray-700 hover:border-red-600"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <div className="text-white font-medium mb-1">{category.label}</div>
                  <div className="text-gray-400 text-sm">{count} templates</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Back Button & Search */}
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedTemplate(null);
                setSearchQuery('');
              }}
              className="text-red-500 hover:text-red-400 mb-3 flex items-center gap-2"
            >
              ← Back to categories
            </button>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {getFilteredTemplates().map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'bg-red-600 border-2 border-red-500'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className="text-white mb-1">{template.templateText}</div>
                {template.description && (
                  <div className="text-gray-400 text-sm">{template.description}</div>
                )}
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((varName, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-900 text-gray-400 rounded text-xs"
                      >
                        {varName}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {getFilteredTemplates().length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No templates found
              </div>
            )}
          </div>

          {/* Variable Input & Send */}
          {selectedTemplate && (
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div className="mb-4 space-y-3">
                  <p className="text-sm text-gray-400 mb-2">Fill in the details:</p>
                  {selectedTemplate.variables.map(varName => (
                    <div key={varName}>
                      <label className="block text-sm text-gray-300 mb-1 capitalize">
                        {varName.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={templateVariables[varName] || ''}
                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                        placeholder={`Enter ${varName}`}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Preview:</p>
                <p className="text-white">
                  {processTemplate(selectedTemplate, templateVariables)}
                </p>
              </div>

              <button
                onClick={handleSend}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <FiSend /> Send Message
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TemplateSelector;
