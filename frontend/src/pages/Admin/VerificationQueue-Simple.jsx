import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVerificationQueue, updateVerification } from '../../store/slices/adminSlice'

const VerificationQueueSimple = () => {
  const dispatch = useDispatch()
  const { verificationQueue, loading } = useSelector((state) => state.admin)
  
  const [filters, setFilters] = useState({
    status: 'PENDING',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    dispatch(fetchVerificationQueue(filters))
  }, [dispatch, filters])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '200px',
        color: 'white' 
      }}>
        Loading verification queue...
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      color: 'white' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: 'white',
          marginBottom: '8px' 
        }}>
          Verification Queue
        </h1>
        <p style={{ color: '#ccc' }}>
          Review and approve user verifications
        </p>
        <p style={{ color: '#ccc', fontSize: '14px' }}>
          Found {verificationQueue?.length || 0} verification(s)
        </p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #666',
            backgroundColor: '#333',
            color: 'white'
          }}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '16px', 
          borderRadius: '8px' 
        }}>
          <div style={{ color: '#fbbf24' }}>⏱️ Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {verificationQueue?.filter(v => v.status === 'PENDING').length || 0}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '16px', 
          borderRadius: '8px' 
        }}>
          <div style={{ color: '#3b82f6' }}>🔄 In Progress</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {verificationQueue?.filter(v => v.status === 'IN_PROGRESS').length || 0}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '16px', 
          borderRadius: '8px' 
        }}>
          <div style={{ color: '#10b981' }}>✅ Approved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {verificationQueue?.filter(v => v.status === 'APPROVED').length || 0}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '16px', 
          borderRadius: '8px' 
        }}>
          <div style={{ color: '#ef4444' }}>❌ Rejected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {verificationQueue?.filter(v => v.status === 'REJECTED').length || 0}
          </div>
        </div>
      </div>

      {/* Verification List */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        borderRadius: '8px', 
        padding: '20px' 
      }}>
        {verificationQueue && verificationQueue.length > 0 ? (
          <div>
            {verificationQueue.map((verification, index) => (
              <div 
                key={verification.id || index}
                style={{
                  borderBottom: '1px solid #374151',
                  paddingBottom: '16px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <h3 style={{ 
                      fontWeight: '500', 
                      marginBottom: '4px',
                      color: 'white'
                    }}>
                      {verification.user?.profile?.firstName || 'N/A'} {verification.user?.profile?.lastName || ''}
                    </h3>
                    <p style={{ 
                      color: '#9ca3af', 
                      fontSize: '14px',
                      margin: '0'
                    }}>
                      {verification.user?.email || 'No email'}
                    </p>
                    <p style={{ 
                      color: '#9ca3af', 
                      fontSize: '14px',
                      margin: '4px 0 0 0'
                    }}>
                      Status: {verification.status || 'Unknown'} | 
                      Type: {verification.documentType || 'N/A'} |
                      Submitted: {verification.createdAt ? new Date(verification.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#374151', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {verification.status || 'UNKNOWN'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <p>No verifications found</p>
            <p style={{ fontSize: '14px' }}>
              {filters.status === 'PENDING' 
                ? 'No pending verifications at this time'
                : `No ${filters.status.toLowerCase()} verifications found`
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Debug info */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px',
        backgroundColor: '#0f172a',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <strong>Debug Info:</strong><br/>
        Loading: {loading ? 'true' : 'false'}<br/>
        Queue Length: {verificationQueue?.length || 0}<br/>
        Filter Status: {filters.status}<br/>
        Redux State: {JSON.stringify({
          hasVerificationQueue: !!verificationQueue,
          queueLength: verificationQueue?.length || 0,
          loading: loading
        }, null, 2)}
      </div>
    </div>
  )
}

export default VerificationQueueSimple