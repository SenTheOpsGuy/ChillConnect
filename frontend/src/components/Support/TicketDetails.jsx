import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FiX,
  FiSend,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiMessageSquare
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TicketDetails = ({ ticketId, onClose, onUpdate }) => {
  const { token, user } = useSelector((state) => state.auth);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicket(response.data.data.ticket);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSending(true);

      await axios.post(
        `${API_URL}/api/support/tickets/${ticketId}/messages`,
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Reply sent successfully');
      setMessage('');
      await fetchTicketDetails();

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-4xl w-full h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">
                  {ticket.subject}
                </h2>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Ticket #{ticket.ticketNumber}</span>
                <span>•</span>
                <span>{getCategoryLabel(ticket.category)}</span>
                <span>•</span>
                <span>{ticket.priority} Priority</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="text-gray-400" size={24} />
            </button>
          </div>

          {/* Ticket Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <FiClock size={14} />
                <span className="text-xs">Created</span>
              </div>
              <p className="text-white text-xs">{formatDateTime(ticket.createdAt)}</p>
            </div>

            {ticket.assignedUser && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiUser size={14} />
                  <span className="text-xs">Assigned</span>
                </div>
                <p className="text-white text-xs">
                  {ticket.assignedUser.profile?.firstName} {ticket.assignedUser.profile?.lastName}
                </p>
              </div>
            )}

            {ticket.resolvedAt && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiCheckCircle size={14} />
                  <span className="text-xs">Resolved</span>
                </div>
                <p className="text-white text-xs">{formatDateTime(ticket.resolvedAt)}</p>
              </div>
            )}

            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <FiMessageSquare size={14} />
                <span className="text-xs">Messages</span>
              </div>
              <p className="text-white text-xs">{ticket.messages?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Initial Description */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="avatar avatar-md">
                {ticket.user?.profile?.firstName?.[0]}{ticket.user?.profile?.lastName?.[0]}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium">
                  {ticket.user?.profile?.firstName} {ticket.user?.profile?.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(ticket.createdAt)}
                </span>
                <span className="px-2 py-0.5 bg-blue-600 bg-opacity-20 text-blue-400 rounded text-xs">
                  You
                </span>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    <p className="text-xs text-gray-400">Attachments:</p>
                    {ticket.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-400 hover:text-blue-300"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {ticket.messages && ticket.messages.map((msg) => {
            const isCurrentUser = msg.sender.id === user.id;
            const isStaff = msg.isStaff;

            return (
              <div key={msg.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className={`avatar avatar-md ${isStaff ? 'bg-green-600' : ''}`}>
                    {msg.sender.profile?.firstName?.[0]}{msg.sender.profile?.lastName?.[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">
                      {msg.sender.profile?.firstName} {msg.sender.profile?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(msg.createdAt)}
                    </span>
                    {isStaff && (
                      <span className="px-2 py-0.5 bg-green-600 bg-opacity-20 text-green-400 rounded text-xs">
                        Support Team
                      </span>
                    )}
                    {isCurrentUser && !isStaff && (
                      <span className="px-2 py-0.5 bg-blue-600 bg-opacity-20 text-blue-400 rounded text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isStaff
                      ? 'bg-green-600 bg-opacity-10 border-green-600'
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <p className="text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Resolution */}
          {ticket.resolution && (
            <div className="p-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="text-green-400" />
                <span className="text-sm font-medium text-green-400">Resolution</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{ticket.resolution}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Form */}
        {!isClosed ? (
          <div className="flex-shrink-0 border-t border-gray-800 p-6">
            {ticket.status === 'WAITING_USER' && (
              <div className="mb-4 p-3 bg-orange-600 bg-opacity-10 border border-orange-600 rounded-lg">
                <p className="text-sm text-orange-400">
                  Our support team is waiting for your response
                </p>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                maxLength={5000}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {message.length}/5000 characters
                </span>
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend size={16} />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-gray-800 p-6">
            <div className="p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-gray-400">
                This ticket is closed. If you need further assistance, please create a new ticket.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;
