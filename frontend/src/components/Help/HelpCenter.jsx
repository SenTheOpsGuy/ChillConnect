import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiSearch,
  FiBook,
  FiTrendingUp,
  FiChevronRight,
  FiThumbsUp,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const HelpCenter = () => {
  const { token } = useSelector((state) => state.auth)
  const [featuredArticles, setFeaturedArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const categoryInfo = {
    GETTING_STARTED: { label: 'Getting Started', icon: '🚀', color: 'bg-blue-600' },
    ACCOUNT: { label: 'Account', icon: '👤', color: 'bg-green-600' },
    BOOKINGS: { label: 'Bookings', icon: '📅', color: 'bg-purple-600' },
    PAYMENTS: { label: 'Payments', icon: '💳', color: 'bg-yellow-600' },
    SAFETY: { label: 'Safety', icon: '🛡️', color: 'bg-red-600' },
    PROVIDERS: { label: 'For Providers', icon: '💼', color: 'bg-indigo-600' },
    FAQ: { label: 'FAQ', icon: '❓', color: 'bg-pink-600' },
  }

  useEffect(() => {
    fetchHelpData()
  }, [])

  const fetchHelpData = async () => {
    try {
      setLoading(true)
      const [featuredRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/help/articles/featured`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/help/articles/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setFeaturedArticles(featuredRes.data.data.articles)
      setCategories(categoriesRes.data.data.categories)
    } catch (error) {
      console.error('Error fetching help data:', error)
      toast.error('Failed to load help articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await axios.get(`${API_URL}/api/help/articles`, {
        params: { search: searchQuery, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      })

      setSearchResults(response.data.data.articles)
    } catch (error) {
      console.error('Error searching articles:', error)
      toast.error('Failed to search articles')
    } finally {
      setSearching(false)
    }
  }

  const handleArticleClick = (article) => {
    window.location.href = `/help/article/${article.slug}`
  }

  const handleCategoryClick = (category) => {
    window.location.href = `/help/category/${category}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">How can we help you?</h1>
        <p className="text-gray-400 text-lg">
          Search our knowledge base or browse by category
        </p>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help articles..."
            className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none text-lg"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Search Results</h2>
          <div className="grid grid-cols-1 gap-4">
            {searchResults.map((article) => (
              <button
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="card hover:border-red-600 transition-all text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-800 rounded">
                        {categoryInfo[article.category]?.label || article.category}
                      </span>
                      <span>{article.viewCount} views</span>
                      <span>{article.helpfulCount} found helpful</span>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Articles */}
      {searchResults.length === 0 && featuredArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FiTrendingUp className="text-red-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Popular Articles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="card hover:border-red-600 transition-all text-left"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-800 rounded">
                    {categoryInfo[article.category]?.label || article.category}
                  </span>
                  <span>{article.viewCount} views</span>
                  {article.helpfulCount > 0 && (
                    <span className="flex items-center gap-1">
                      <FiThumbsUp size={12} />
                      {article.helpfulCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {searchResults.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FiBook className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const info = categoryInfo[category.category] || {
                label: category.category,
                icon: '📄',
                color: 'bg-gray-600',
              }

              return (
                <button
                  key={category.category}
                  onClick={() => handleCategoryClick(category.category)}
                  className="card hover:border-red-600 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${info.color} bg-opacity-20 rounded-lg flex-shrink-0`}>
                      <span className="text-2xl">{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-red-500 transition-colors">
                        {info.label}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {category.count} {category.count === 1 ? 'article' : 'articles'}
                      </p>
                      {category.articles && category.articles.length > 0 && (
                        <ul className="space-y-1">
                          {category.articles.slice(0, 3).map((article) => (
                            <li key={article.id} className="text-xs text-gray-500 truncate">
                              • {article.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <FiChevronRight className="text-gray-400 group-hover:text-red-500 flex-shrink-0 transition-colors" size={20} />
                  </div>
                </button>
              )
            })}
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
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <button
            onClick={() => window.location.href = '/support/tickets'}
            className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpCenter
