import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiArrowLeft,
  FiThumbsUp,
  FiClock,
  FiEye,
  FiChevronRight,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const HelpArticle = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [helpful, setHelpful] = useState(false)

  const categoryInfo = {
    GETTING_STARTED: { label: 'Getting Started', icon: '🚀' },
    ACCOUNT: { label: 'Account', icon: '👤' },
    BOOKINGS: { label: 'Bookings', icon: '📅' },
    PAYMENTS: { label: 'Payments', icon: '💳' },
    SAFETY: { label: 'Safety', icon: '🛡️' },
    PROVIDERS: { label: 'For Providers', icon: '💼' },
    FAQ: { label: 'FAQ', icon: '❓' },
  }

  useEffect(() => {
    if (slug) {
      fetchArticle()
    }
  }, [slug])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/help/articles/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setArticle(response.data.data.article)
      setRelatedArticles(response.data.data.relatedArticles || [])
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Failed to load article')
      navigate('/help')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkHelpful = async () => {
    if (helpful || !article) {return}

    try {
      await axios.post(
        `${API_URL}/api/help/articles/${article.id}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setHelpful(true)
      setArticle({ ...article, helpfulCount: article.helpfulCount + 1 })
      toast.success('Thank you for your feedback!')
    } catch (error) {
      console.error('Error marking helpful:', error)
      toast.error('Failed to submit feedback')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Simple markdown to HTML converter for basic formatting
  const renderMarkdown = (content) => {
    if (!content) {return ''}

    let html = content

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mt-10 mb-5">$1</h1>')

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')

    // Code blocks
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-900 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm text-gray-300">$1</code></pre>')

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-gray-800 rounded text-red-400 text-sm">$1</code>')

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-red-400 hover:text-red-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li class="ml-6 text-gray-300">$1</li>')
    html = html.replace(/^- (.+)$/gim, '<li class="ml-6 text-gray-300">$1</li>')

    // Wrap consecutive list items
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc my-4 space-y-2">$&</ul>')

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (para.trim() && !para.startsWith('<')) {
        return `<p class="text-gray-300 leading-relaxed my-4">${para}</p>`
      }
      return para
    }).join('\n')

    return html
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!article) {
    return null
  }

  const categoryLabel = categoryInfo[article.category]?.label || article.category
  const categoryIcon = categoryInfo[article.category]?.icon || '📄'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/help')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <FiArrowLeft size={20} />
        Back to Help Center
      </button>

      {/* Article Header */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <span className="text-lg">{categoryIcon}</span>
            {categoryLabel}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FiClock size={14} />
            Updated {formatDate(article.updatedAt)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FiEye size={14} />
            {article.viewCount} views
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-gray-400 mb-6">
            {article.excerpt}
          </p>
        )}

        {/* Article Content */}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-800">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Helpful Section */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium mb-1">Was this article helpful?</p>
              <p className="text-sm text-gray-400">
                {article.helpfulCount} people found this helpful
              </p>
            </div>
            <button
              onClick={handleMarkHelpful}
              disabled={helpful}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                helpful
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <FiThumbsUp size={18} />
              {helpful ? 'Thanks for your feedback!' : 'Yes, this was helpful'}
            </button>
          </div>
        </div>

        {/* Author */}
        {article.author && (
          <div className="mt-6 pt-6 border-t border-gray-800 flex items-center gap-3">
            <div className="avatar avatar-md">
              {article.author.profile?.firstName?.[0]}{article.author.profile?.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm text-gray-400">Written by</p>
              <p className="text-white font-medium">
                {article.author.profile?.firstName} {article.author.profile?.lastName}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArticles.map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/help/article/${related.slug}`)}
                className="card hover:border-red-600 transition-all text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  <FiChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Still Need Help */}
      <div className="card bg-gradient-to-r from-red-600 to-pink-600 border-none">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Still need help?
          </h3>
          <p className="text-white text-opacity-90 mb-4">
            Our support team is ready to assist you.
          </p>
          <button
            onClick={() => navigate('/support/tickets')}
            className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpArticle
