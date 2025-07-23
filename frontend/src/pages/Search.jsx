import { useState, useEffect } from 'react'
import { FiSearch, FiFilter, FiMapPin, FiStar, FiClock } from 'react-icons/fi'

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    location: '',
    service: '',
    minRating: 0,
    maxRate: 1000
  })
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch providers from backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('🔍 Fetching providers from /api/providers...')
        setLoading(true)
        const response = await fetch('/api/providers')
        
        console.log('📡 API Response:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Provider data:', data)
          setProviders(data.providers || [])
        } else {
          // Fallback to mock data if API fails
          const mockProviders = [
            {
              id: 'provider-1',
              name: 'Sarah Johnson',
              location: 'Mumbai',
              rating: 4.8,
              reviewCount: 156,
              baseRate: 50,
              seekerRate: 65, // 50 + 30% platform fee
              platformFee: 15,
              services: ['Companion', 'Massage'],
              profilePhoto: null,
              availability: 'Available'
            },
            {
              id: 'provider-2',
              name: 'Emma Wilson',
              location: 'Delhi',
              rating: 4.9,
              reviewCount: 203,
              baseRate: 75,
              seekerRate: 98, // 75 + 30% platform fee
              platformFee: 23,
              services: ['Companion', 'Escort'],
              profilePhoto: null,
              availability: 'Available'
            }
          ]
          setProviders(mockProviders)
        }
      } catch (err) {
        console.error('❌ Error fetching providers:', err)
        setError('Failed to load providers')
        // Fallback to mock data
        const mockProviders = [
          {
            id: 'provider-1',
            name: 'Sarah Johnson',
            location: 'Mumbai',
            rating: 4.8,
            reviewCount: 156,
            baseRate: 50,
            seekerRate: 65, // 50 + 30% platform fee
            platformFee: 15,
            services: ['Companion', 'Massage'],
            profilePhoto: null,
            availability: 'Available'
          },
          {
            id: 'provider-2',
            name: 'Emma Wilson',
            location: 'Delhi',
            rating: 4.9,
            reviewCount: 203,
            baseRate: 75,
            seekerRate: 98, // 75 + 30% platform fee
            platformFee: 23,
            services: ['Companion', 'Escort'],
            profilePhoto: null,
            availability: 'Available'
          }
        ]
        setProviders(mockProviders)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Providers</h1>
        <p className="text-gray-600">Discover verified providers in your area</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi</option>
              <option value="bangalore">Bangalore</option>
              <option value="kolkata">Kolkata</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="relative">
            <select
              value={filters.service}
              onChange={(e) => setFilters({...filters, service: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Services</option>
              <option value="companion">Companion</option>
              <option value="massage">Massage</option>
              <option value="escort">Escort</option>
            </select>
          </div>

          {/* Filter Button */}
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <FiFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading providers...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="avatar avatar-md mr-4 flex-shrink-0">
                {provider.profilePhoto ? (
                  <img
                    src={provider.profilePhoto}
                    alt={provider.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {provider.name.split(' ').map(n => n.charAt(0)).join('')}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{provider.name}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <FiMapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{provider.location}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center mb-3">
              <div className="flex items-center text-yellow-400 mr-2">
                <FiStar className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-900 ml-1">
                  {provider.rating}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({provider.reviewCount} reviews)
              </span>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {provider.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600 flex-1">
                <span className="font-medium text-gray-900 block">
                  {provider.seekerRate || provider.hourlyRate} tokens/hour
                </span>
                {provider.baseRate && provider.seekerRate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Base: {provider.baseRate} + Platform fee: {provider.platformFee || Math.round(provider.baseRate * 0.3)}
                  </div>
                )}
              </div>
              <div className="flex items-center text-sm text-green-600 flex-shrink-0">
                <FiClock className="w-3 h-3 mr-1" />
                <span className="truncate">{provider.availability}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full btn btn-primary btn-sm">
                View Profile
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && providers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No providers found matching your criteria.</p>
        </div>
      )}

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="btn btn-secondary">
          Load More Providers
        </button>
      </div>
    </div>
  )
}

export default Search