import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiEye,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DisputeManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [disputes, setDisputes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [managers, setManagers] = useState([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveData, setResolveData] = useState({
    resolution: '',
    refundIssued: false,
    refundAmount: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDisputes();
    fetchStatistics();
    fetchManagers();
  }, [page, statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await axios.get(`${API_URL}/api/disputes/admin/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setDisputes(response.data.data.disputes);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/disputes/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      // Fetch users with MANAGER role or higher
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        params: { role: 'MANAGER' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      // Silently fail, not critical
    }
  };

  const handleAssignManager = async (disputeId, managerId) => {
    try {
      await axios.put(
        `${API_URL}/api/disputes/${disputeId}/assign`,
        { managerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Manager assigned successfully');
      fetchDisputes();
    } catch (error) {
      console.error('Error assigning manager:', error);
      toast.error(error.response?.data?.error || 'Failed to assign manager');
    }
  };

  const handleResolve = async () => {
    if (!resolveData.resolution.trim()) {
      toast.error('Please provide a resolution description');
      return;
    }

    if (resolveData.refundIssued && (!resolveData.refundAmount || resolveData.refundAmount <= 0)) {
      toast.error('Please specify a valid refund amount');
      return;
    }

    try {
      setSubmitting(true);

      await axios.put(
        `${API_URL}/api/disputes/${selectedDispute.id}/resolve`,
        {
          resolution: resolveData.resolution.trim(),
          refundIssued: resolveData.refundIssued,
          refundAmount: resolveData.refundIssued ? parseInt(resolveData.refundAmount) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Dispute resolved successfully');
      setShowResolveModal(false);
      setSelectedDispute(null);
      setResolveData({ resolution: '', refundIssued: false, refundAmount: 0 });
      fetchDisputes();
      fetchStatistics();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-500 border-yellow-600';
      case 'INVESTIGATING':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600';
      case 'RESOLVED':
        return 'bg-green-600 bg-opacity-20 text-green-500 border-green-600';
      case 'CLOSED':
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600';
      case 'ESCALATED':
        return 'bg-red-600 bg-opacity-20 text-red-500 border-red-600';
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600';
    }
  };

  const getDisputeTypeLabel = (type) => {
    const labels = {
      NO_SHOW: 'No Show',
      SERVICE_QUALITY: 'Service Quality',
      PAYMENT_ISSUE: 'Payment Issue',
      BEHAVIOR_ISSUE: 'Behavior Issue',
      TERMS_VIOLATION: 'Terms Violation',
      OTHER: 'Other'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dispute Management</h1>
        <p className="text-gray-400">Review and resolve user disputes</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Disputes</span>
              <FiActivity className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-500">All time</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Open Cases</span>
              <FiAlertTriangle className="text-yellow-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.OPEN || 0}
            </div>
            <div className="text-sm text-gray-500">Need attention</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Investigating</span>
              <FiClock className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.INVESTIGATING || 0}
            </div>
            <div className="text-sm text-gray-500">In progress</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Resolved</span>
              <FiCheckCircle className="text-green-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.RESOLVED || 0}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ESCALATED'].map((status) => (
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
            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Disputes Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Case ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Filed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No disputes found
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-white font-mono text-sm">
                        #{dispute.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        {getDisputeTypeLabel(dispute.disputeType)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        {dispute.reporter?.profile?.firstName} {dispute.reporter?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        vs {dispute.reportedUser?.profile?.firstName} {dispute.reportedUser?.profile?.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                      {dispute.appealedAt && (
                        <div className="mt-1">
                          <span className="px-2 py-1 bg-yellow-600 bg-opacity-20 text-yellow-400 rounded text-xs">
                            Appealed
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-300 text-sm">
                        {formatDate(dispute.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {dispute.assignedManager ? (
                        <div className="text-white text-sm">
                          {dispute.assignedManager.profile?.firstName}
                        </div>
                      ) : dispute.status === 'OPEN' ? (
                        <select
                          onChange={(e) => handleAssignManager(dispute.id, e.target.value)}
                          className="text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign...</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.profile?.firstName} {manager.profile?.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowResolveModal(true);
                          }}
                          className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <FiEye size={14} />
                          View
                        </button>
                        {(dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING') && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolveModal(true);
                            }}
                            className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1"
                          >
                            <FiCheckCircle size={14} />
                            Resolve
                          </button>
                        )}
                      </div>
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

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Resolve Dispute #{selectedDispute.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-400">
                  {getDisputeTypeLabel(selectedDispute.disputeType)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedDispute(null);
                  setResolveData({ resolution: '', refundIssued: false, refundAmount: 0 });
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiXCircle className="text-gray-400" size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Dispute Info */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Dispute Details</h3>
                <p className="text-white mb-3">{selectedDispute.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Reporter:</span>
                    <span className="text-white ml-2">
                      {selectedDispute.reporter?.profile?.firstName} {selectedDispute.reporter?.profile?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Against:</span>
                    <span className="text-white ml-2">
                      {selectedDispute.reportedUser?.profile?.firstName} {selectedDispute.reportedUser?.profile?.lastName}
                    </span>
                  </div>
                  {selectedDispute.booking && (
                    <>
                      <div>
                        <span className="text-gray-500">Booking:</span>
                        <span className="text-white ml-2">
                          {new Date(selectedDispute.booking.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="text-white ml-2">
                          {selectedDispute.booking.totalTokens} tokens
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Evidence */}
              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Evidence</h3>
                  <div className="space-y-2">
                    {selectedDispute.evidence.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-red-400 hover:text-red-300"
                      >
                        Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Resolution <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolveData.resolution}
                    onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                    placeholder="Describe the resolution and actions taken..."
                    rows={5}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {resolveData.resolution.length}/2000 characters
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resolveData.refundIssued}
                      onChange={(e) => setResolveData({ ...resolveData, refundIssued: e.target.checked })}
                      className="w-5 h-5 text-red-600"
                    />
                    <span className="text-white">Issue refund to reporter</span>
                  </label>

                  {resolveData.refundIssued && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Refund Amount (tokens) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedDispute.booking?.totalTokens || 999999}
                        value={resolveData.refundAmount}
                        onChange={(e) => setResolveData({ ...resolveData, refundAmount: e.target.value })}
                        placeholder="Enter token amount"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                      />
                      {selectedDispute.booking && (
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {selectedDispute.booking.totalTokens} tokens
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedDispute(null);
                    setResolveData({ resolution: '', refundIssued: false, refundAmount: 0 });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} />
                      Resolve Dispute
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
