import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BrandMark } from '@/components/BrandMark'
import { UserMenu } from '@/components/UserMenu'
import { useScrolled } from '@/hooks/useScrolled'
import { tr } from '@/i18n'
import { LanguageSwitch } from '@/components/LanguageSwitch'

const makeLinkCls =
  (dark: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      dark ? (isActive ? 'bg-white/15 text-white' : 'text-white hover:bg-white/10') : isActive ? 'bg-brand-tint text-brand-dark' : 'text-ink hover:bg-brand-tint'
    }`

export function PublicLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()
  const isLanding = useLocation().pathname === '/'
  // on the landing page the header floats over the dark hero until the page is scrolled
  const dark = isLanding && !scrolled && !open
  const linkCls = makeLinkCls(dark)

  const links = (
    <>
      <NavLink to="/doctors" className={linkCls} onClick={() => setOpen(false)}>{tr("ექიმები")}</NavLink>
      {user?.role === 'patient' && (
        <>
          <NavLink to="/my-appointments" className={linkCls} onClick={() => setOpen(false)}>{tr("ჩემი ვიზიტები")}</NavLink>
          <NavLink to="/profile" className={linkCls} onClick={() => setOpen(false)}>{tr("პროფილი")}</NavLink>
        </>
      )}
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <NavLink to="/dashboard" className={linkCls} onClick={() => setOpen(false)}>{tr("სამუშაო სივრცე")}</NavLink>
      )}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className={`${isLanding ? 'fixed inset-x-0' : 'sticky'} top-0 z-40 border-b transition-shadow duration-200 ${scrolled || open ? 'app-header' : 'app-header--top'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <BrandMark dark={dark} />
            <nav className="hidden items-center gap-1 md:flex" aria-label={tr("მთავარი ნავიგაცია")}>
              {links}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch dark={dark} />
            {user ? (
              <UserMenu dark={dark} />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login" className={`rounded-md px-3 py-2 text-sm font-medium ${dark ? 'text-white hover:bg-white/10' : 'hover:bg-brand-tint'}`}>{tr("შესვლა")}</Link>
                <Link to="/register" className={`rounded-md px-4 py-2 text-sm font-medium ${dark ? 'bg-white text-ink hover:bg-brand-tint' : 'bg-brand text-white hover:bg-brand-dark'}`}>{tr("რეგისტრაცია")}</Link>
              </div>
            )}
            <button
              className={`rounded-md p-2 md:hidden ${dark ? 'text-white hover:bg-white/10' : 'hover:bg-brand-tint'}`}
              aria-label={open ? tr("მენიუს დახურვა") : tr("მენიუს გახსნა")}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden" aria-label={tr("მობილური ნავიგაცია")}>
            {links}
            {!user && (
              <>
                <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>{tr("შესვლა")}</NavLink>
                <NavLink to="/register" className={linkCls} onClick={() => setOpen(false)}>{tr("რეგისტრაცია")}</NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main className={isLanding ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8'}>
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">{tr("MediBook სასწავლო პროექტია. ექიმები და ვიზიტები გამოგონილია, ნამდვილ სამედიცინო დახმარებას ვერ ჩაანაცვლებს.")}</div>
      </footer>
    </div>
  )
}
