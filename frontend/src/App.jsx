import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { loadUser } from './store/slices/authSlice'
import { SocketProvider } from './contexts/SocketContext'

// Components
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import OtpLogin from './pages/Auth/OtpLogin'
import OtpRequest from './pages/Auth/OtpRequest'
import OtpVerify from './pages/Auth/OtpVerify'
import EmailVerification from './pages/Auth/EmailVerification'
import Dashboard from './pages/Dashboard/Dashboard'
import Profile from './pages/Profile'
import Verification from './pages/Verification'
import Search from './pages/Search'
import Booking from './pages/Booking'
import BookingDetails from './pages/BookingDetails'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Wallet from './pages/Wallet'
import Settings from './pages/Settings'
import AdminDashboard from './pages/Admin/Dashboard'
import VerificationQueue from './pages/Admin/VerificationQueue'
import BookingMonitoring from './pages/Admin/BookingMonitoring'
import UserManagement from './pages/Admin/UserManagement'
import NotFound from './pages/NotFound'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  useEffect(() => {
    // Load user from localStorage on app start
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(loadUser())
    }
  }, [dispatch])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />
          <Route
            path="/login-otp"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OtpRequest />
              )
            }
          />
          <Route
            path="/otp-verify"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OtpVerify />
              )
            }
          />
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Common Routes */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/verify" element={<Verification />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/chat/:bookingId" element={<Chat />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Seeker Routes */}
                    <Route
                      path="/search"
                      element={
                        <ProtectedRoute roles={['SEEKER']}>
                          <Search />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/booking/:providerId"
                      element={
                        <ProtectedRoute roles={['SEEKER']}>
                          <Booking />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/booking-details/:bookingId"
                      element={
                        <ProtectedRoute roles={['SEEKER', 'PROVIDER']}>
                          <BookingDetails />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute roles={['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/verification-queue"
                      element={
                        <ProtectedRoute roles={['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
                          <VerificationQueue />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/booking-monitoring"
                      element={
                        <ProtectedRoute roles={['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
                          <BookingMonitoring />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute roles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Default redirect to dashboard */}
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </SocketProvider>
  )
}

export default App