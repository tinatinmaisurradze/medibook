import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { defaultHome } from '@/utils/roles'

/** /dashboard sends every signed-in user to the workspace of their role */
export default function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? (user.role === 'patient' ? '/my-appointments' : defaultHome(user.role)) : '/login'} replace />
}
