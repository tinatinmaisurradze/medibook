import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, CalendarDays, DoorOpen, Menu, Stethoscope, UserRoundX, X, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BrandMark } from '@/components/BrandMark'
import { UserMenu } from '@/components/UserMenu'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV: Record<'doctor' | 'admin', NavItem[]> = {
  doctor: [{ to: '/doctor/schedule', label: 'ჩემი განრიგი', icon: CalendarDays }],
  admin: [
    { to: '/admin/stats', label: 'სტატისტიკა', icon: BarChart3 },
    { to: '/admin/schedule', label: 'ექიმების გრაფიკი', icon: Stethoscope },
    { to: '/admin/rooms', label: 'კაბინეტები', icon: DoorOpen },
    { to: '/admin/cancellations', label: 'გაუქმებული ვიზიტები', icon: UserRoundX },
  ],
}

export function DashboardLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const items = user?.role === 'admin' ? NAV.admin : NAV.doctor

  const sidebar = (
    <nav className="flex flex-col gap-1 p-4" aria-label="სამუშაო სივრცის მენიუ">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand text-white' : 'text-ink hover:bg-brand-tint'
            }`
          }
        >
          <Icon size={18} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] md:grid-cols-[260px_1fr]">
      <header className="col-span-full flex h-16 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 hover:bg-brand-tint md:hidden"
            aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <BrandMark />
        </div>
        <UserMenu />
      </header>

      <aside className="hidden border-r border-line bg-surface md:block">{sidebar}</aside>
      {open && <div className="border-b border-line bg-surface md:hidden">{sidebar}</div>}

      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>

      <footer className="col-span-full border-t border-line bg-surface px-4 py-4 text-sm text-muted">
        MediBook სამუშაო სივრცე · სასწავლო პროექტი
      </footer>
    </div>
  )
}
