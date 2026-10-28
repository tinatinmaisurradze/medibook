import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { profilePath } from '@/utils/roles'
import { Button } from './ui/Button'

const ROLE_LABEL = { patient: 'პაციენტი', doctor: 'ექიმი', admin: 'ადმინისტრატორი' } as const

export function UserMenu({ dark = false }: { dark?: boolean }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { notify } = useToast()
  if (!user) return null
  return (
    <div className="flex items-center gap-3">
      <Link to={profilePath(user.role)} className={`hidden rounded-md px-2 py-1 text-right leading-tight sm:block ${dark ? 'text-white hover:bg-white/10' : 'hover:bg-brand-tint'}`} aria-label="ჩემი პროფილი">
        <p className="text-sm font-medium">{user.fullName}</p>
        <p className={`text-xs ${dark ? 'text-white/70' : 'text-muted'}`}>{ROLE_LABEL[user.role]}</p>
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
