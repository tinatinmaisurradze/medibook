import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthResponse, Role, User } from '@/types'
import { authService } from '@/services/authService'
import { tokenStore } from '@/services/http'

interface AuthContextValue {
  user: User | null
  /** true while the stored token is being verified on first load */
  initializing: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { fullName: string; email: string; phone?: string; password: string }) => Promise<User>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(() => tokenStore.get() !== null)

  useEffect(() => {
    if (!tokenStore.get()) return
    authService
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setInitializing(false))
  }, [])

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      login: async (email, password) => accept(await authService.login(email, password)),
      register: async (data) => accept(await authService.register(data)),
      logout: () => {
        tokenStore.clear()
        setUser(null)
      },
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, initializing, accept],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
