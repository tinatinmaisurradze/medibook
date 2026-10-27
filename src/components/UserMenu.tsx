import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { profilePath } from '@/utils/roles'
import { Button } from './ui/Button'

const ROLE_LABEL = { patient: 'პაციენტი', doctor: 'ექიმი', admin: 'ადმინისტრატორი' } as const

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { notify } = useToast()
  if (!user) return null
  return (
    <div className="flex items-center gap-3">
      <Link to={profilePath(user.role)} className="hidden rounded-md px-2 py-1 text-right leading-tight hover:bg-brand-tint sm:block" aria-label="ჩემი პროფილი">
        <p className="text-sm font-medium">{user.fullName}</p>
        <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
      </Link>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          logout()
          navigate('/')
          notify('გამოხვედით სისტემიდან')
        }}
      >
        <LogOut size={16} aria-hidden />
        გასვლა
      </Button>
    </div>
  )
}
