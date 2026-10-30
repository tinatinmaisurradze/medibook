import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'
import { PageSpinner } from './ui/States'
import { tr } from '@/i18n'

/** Redirects guests to /login and users with a wrong role to /403. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <PageSpinner label={tr("მომხმარებლის შემოწმება...")} />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />
  return <Outlet />
}
