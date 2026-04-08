import { Navigate, useLocation } from 'react-router-dom'
import { hasToken } from '../services/authService'

function RequireAuth({ children }) {
  const location = useLocation()

  if (!hasToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireAuth
