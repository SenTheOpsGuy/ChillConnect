import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiMessageSquare,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const SupportManagement = () => {
  const { token } = useSelector((state) => state.auth)
  const [tickets, setTickets] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  })
  // const [selectedTicket, setSelectedTicket] = useState(null)
  // const [assigneeId, setAssigneeId] = useState('')
  // const [resolution, setResolution] = useState('')
  // const [submitting, setSubmitting] = useState(false)
  const [closingTicketId, setClosingTicketId] = useState(null)

  useEffect(() => {
    fetchTickets()
    fetchStatistics()
  }, [page, filters])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20, ...filters }

      const response = await axios.get(`${API_URL}/api/support/admin/tickets`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })

      setTickets(response.data.data.tickets)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/support/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatistics(response.data.data.statistics)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  // const handleAssign = async (ticketId) => {
  //   if (!assigneeId) {
  //     toast.error('Please select a staff member')
  //     return
  //   }

  //   try {
  //     setSubmitting(true)
  //     await axios.put(
  //       `${API_URL}/api/support/admin/tickets/${ticketId}/assign`,
  //       { assignedTo: assigneeId },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     )

  //     toast.success('Ticket assigned successfully')
  //     fetchTickets()
  //     setSelectedTicket(null)
  //   } catch (error) {
  //     console.error('Error assigning ticket:', error)
  //     toast.error(error.response?.data?.error || 'Failed to assign ticket')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

  // const handleResolve = async (ticketId) => {
  //   if (!resolution.trim()) {
  //     toast.error('Please provide a resolution summary')
  //     return
  //   }

  //   try {
  //     setSubmitting(true)
  //     await axios.put(
  //       `${API_URL}/api/support/admin/tickets/${ticketId}/resolve`,
  //       { resolution: resolution.trim() },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     )

  //     toast.success('Ticket resolved successfully')
  //     fetchTickets()
  //     fetchStatistics()
  //     setSelectedTicket(null)
  //     setResolution('')
  //   } catch (error) {
  //     console.error('Error resolving ticket:', error)
  //     toast.error(error.response?.data?.error || 'Failed to resolve ticket')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

  const confirmClose = async () => {
    if (!closingTicketId) {return}

    try {
      await axios.put(
        `${API_URL}/api/support/admin/tickets/${closingTicketId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Ticket closed successfully')
      fetchTickets()
      fetchStatistics()
      setClosingTicketId(null)
    } catch (error) {
      console.error('Error closing ticket:', error)
      toast.error(error.response?.data?.error || 'Failed to close ticket')
    } finally {
      setClosingTicketId(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-500 border-yellow-600'
      case 'IN_PROGRESS':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600'
      case 'WAITING_USER':
        return 'bg-orange-600 bg-opacity-20 text-orange-500 border-orange-600'
      case 'RESOLVED':
        return 'bg-green-600 bg-opacity-20 text-green-500 border-green-600'
      case 'CLOSED':
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500'
      case 'HIGH':
        return 'text-yellow-500'
      case 'MEDIUM':
        return 'text-blue-500'
      case 'LOW':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Support Ticket Management</h1>
        <p className="text-gray-400">Review and respond to user support tickets</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Tickets</span>
              <FiMessageSquare className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-500">All time</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Open</span>
              <FiAlertTriangle className="text-yellow-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.OPEN || 0}
            </div>
            <div className="text-sm text-gray-500">Need attention</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">In Progress</span>
              <FiClock className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.IN_PROGRESS || 0}
            </div>
            <div className="text-sm text-gray-500">Being worked on</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Resolved</span>
              <FiCheckCircle className="text-green-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.RESOLVED || 0}
            </div>
            {statistics.avgResponseTimeHours && (
              <div className="text-sm text-gray-500">
                Avg: {statistics.avgResponseTimeHours}h
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_USER">Waiting User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="ACCOUNT">Account</option>
              <option value="BOOKING">Booking</option>
              <option value="PAYMENT">Payment</option>
              <option value="TECHNICAL">Technical</option>
              <option value="VERIFICATION">Verification</option>
              <option value="SAFETY">Safety</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ticket #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-white font-mono text-sm">
                        #{ticket.ticketNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm font-medium truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{ticket.category}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        {ticket.user?.profile?.firstName} {ticket.user?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{ticket.user?.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-300 text-sm">
                        {formatDate(ticket.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {ticket.assignedUser ? (
                        <div className="text-white text-sm">
                          {ticket.assignedUser.profile?.firstName}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => window.open(`/support/ticket/${ticket.id}`, '_blank')}
                        className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <FiEye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400 px-4">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Close Confirmation Modal */}
      {closingTicketId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Close Ticket</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to close this ticket?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Close Ticket
              </button>
              <button
                onClick={() => setClosingTicketId(null)}
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

export default SupportManagement
