import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BrandMark } from '@/components/BrandMark'
import { UserMenu } from '@/components/UserMenu'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-tint text-brand-dark' : 'text-ink hover:bg-brand-tint'}`

export function PublicLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const links = (
    <>
      <NavLink to="/doctors" className={linkCls} onClick={() => setOpen(false)}>
        ექიმები
      </NavLink>
      {user?.role === 'patient' && (
        <NavLink to="/my-appointments" className={linkCls} onClick={() => setOpen(false)}>
          ჩემი ვიზიტები
        </NavLink>
      )}
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <NavLink to="/dashboard" className={linkCls} onClick={() => setOpen(false)}>
          სამუშაო სივრცე
        </NavLink>
      )}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <BrandMark />
            <nav className="hidden items-center gap-1 md:flex" aria-label="მთავარი ნავიგაცია">
              {links}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-brand-tint">
                  შესვლა
                </Link>
                <Link to="/register" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                  რეგისტრაცია
                </Link>
              </div>
            )}
            <button
              className="rounded-md p-2 hover:bg-brand-tint md:hidden"
              aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden" aria-label="მობილური ნავიგაცია">
            {links}
            {!user && (
              <>
                <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>
                  შესვლა
                </NavLink>
                <NavLink to="/register" className={linkCls} onClick={() => setOpen(false)}>
                  რეგისტრაცია
                </NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
          MediBook სასწავლო პროექტია. ექიმები და ვიზიტები გამოგონილია, ნამდვილ სამედიცინო დახმარებას ვერ ჩაანაცვლებს.
        </div>
      </footer>
    </div>
  )
}
