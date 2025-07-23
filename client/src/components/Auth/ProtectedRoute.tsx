import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { RootState } from '../../store/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute