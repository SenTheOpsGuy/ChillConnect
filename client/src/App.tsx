import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from './store/store'
import { checkAuth } from './store/slices/authSlice'
import { SocketProvider } from './contexts/SocketContext'

// Components
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import VerifyEmail from './pages/Auth/VerifyEmail'
import Dashboard from './pages/Dashboard/Dashboard'
import Search from './pages/Search/Search'
import Booking from './pages/Booking/Booking'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/Profile'
import Wallet from './pages/Wallet/Wallet'
import AdminPanel from './pages/Admin/AdminPanel'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(checkAuth() as any)
  }, [dispatch])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <SocketProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="booking/:id?" element={<Booking />} />
          <Route path="chat/:bookingId?" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="admin/*" element={<AdminPanel />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  )
}

export default App