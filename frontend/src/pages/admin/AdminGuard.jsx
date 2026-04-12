import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminGuard() {
  const { isAuth, isAdmin } = useAuth()
  if (!isAuth || !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
