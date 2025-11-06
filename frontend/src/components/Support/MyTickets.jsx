import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FiHelpCircle,
  FiEye,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiMessageSquare
} from 'react-icons/fi';
import TicketForm from './TicketForm';
import TicketDetails from './TicketDetails';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyTickets = () => {
  const { token } = useSelector((state) => state.auth);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await axios.get(`${API_URL}/api/support/tickets`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setTickets(response.data.data.tickets);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiHelpCircle className="text-yellow-500" />;
      case 'IN_PROGRESS':
        return <FiClock className="text-blue-500" />;
      case 'WAITING_USER':
        return <FiMessageSquare className="text-orange-500" />;
      case 'RESOLVED':
        return <FiCheckCircle className="text-green-500" />;
      case 'CLOSED':
        return <FiCheckCircle className="text-gray-500" />;
      default:
        return <FiHelpCircle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-500 border-yellow-600';
      case 'IN_PROGRESS':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600';
      case 'WAITING_USER':
        return 'bg-orange-600 bg-opacity-20 text-orange-500 border-orange-600';
      case 'RESOLVED':
        return 'bg-green-600 bg-opacity-20 text-green-500 border-green-600';
      case 'CLOSED':
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600';
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500';
      case 'HIGH':
        return 'text-yellow-500';
      case 'MEDIUM':
        return 'text-blue-500';
      case 'LOW':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      ACCOUNT: 'Account',
      BOOKING: 'Booking',
      PAYMENT: 'Payment',
      TECHNICAL: 'Technical',
      VERIFICATION: 'Verification',
      SAFETY: 'Safety',
      OTHER: 'Other'
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Support Tickets</h2>
            <p className="text-gray-400">
              View and track your support requests
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> New Ticket
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="card text-center py-12">
            <FiHelpCircle className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">No support tickets found</p>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              {statusFilter !== 'ALL'
                ? `No tickets with status: ${statusFilter}`
                : 'You have not created any support tickets'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FiPlus /> Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const lastMessage = ticket.messages?.[0];

              return (
                <div key={ticket.id} className="card hover:border-blue-600 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`p-3 rounded-lg border ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-semibold">
                              {ticket.subject}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>Ticket #{ticket.ticketNumber}</span>
                            <span>•</span>
                            <span>{getCategoryLabel(ticket.category)}</span>
                            <span>•</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {ticket.description}
                      </p>

                      {/* Last Message */}
                      {lastMessage && (
                        <div className="p-3 bg-gray-800 rounded-lg mb-3">
                          <p className="text-xs text-gray-400 mb-1">
                            Last reply {lastMessage.isStaff ? 'from support' : 'from you'}:
                          </p>
                          <p className="text-sm text-gray-300 line-clamp-1">
                            {lastMessage.message}
                          </p>
                        </div>
                      )}

                      {/* Assigned */}
                      {ticket.assignedUser && (
                        <p className="text-xs text-gray-500 mb-3">
                          Assigned to: {ticket.assignedUser.profile?.firstName} {ticket.assignedUser.profile?.lastName}
                        </p>
                      )}

                      {/* Actions */}
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-2 font-medium"
                      >
                        <FiEye size={16} />
                        View Details & Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
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

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <TicketForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchTickets();
          }}
        />
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetails
          ticketId={selectedTicket.id}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}
    </>
  );
};

export default MyTickets;
