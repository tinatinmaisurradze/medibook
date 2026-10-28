import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/services/http'
import { loginSchema, type LoginForm } from '@/utils/validation'
import { TextField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { afterLoginPath } from '@/utils/roles'
import { DEMO_ACCOUNTS } from '@/data/seed'
import { UserRound, Stethoscope, ShieldCheck } from 'lucide-react'

export default function Login() {
  const { user, login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [serverError, setServerError] = useState<string | null>(null)
  const [quickBusy, setQuickBusy] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  if (user) return <Navigate to={afterLoginPath(user.role, from)} replace />

  const quickLogin = async (email: string) => {
    setServerError(null)
    setQuickBusy(email)
    try {
      const u = await login(email, 'Demo1234!')
      notify(`მოგესალმებით, ${u.fullName}`)
      navigate(afterLoginPath(u.role, from), { replace: true })
    } catch (e) {
      setServerError(errorMessage(e))
      setQuickBusy(null)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    try {
      const u = await login(data.email, data.password)
      notify(`მოგესალმებით, ${u.fullName}`)
      navigate(afterLoginPath(u.role, from), { replace: true })
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">შესვლა</h1>
      {from && (from.startsWith('/book') || from.includes('#slots')) && (
        <p className="mt-3 rounded-md bg-brand-tint px-4 py-3 text-sm text-brand-dark">ვიზიტის დასაჯავშნად ჯერ შედით ანგარიშში. შესვლის შემდეგ პირდაპირ დაბრუნდებით არჩეულ ექიმთან.</p>
      )}
      <p className="mt-1 text-muted">
        არ გაქვთ ანგარიში?{' '}
        <Link to="/register" className="font-medium text-brand-dark underline">
          დარეგისტრირდით
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 max-w-md space-y-4 rounded-xl border border-line bg-surface p-6 shadow-card">
        {serverError && (
          <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}
        <TextField label="ელ-ფოსტა" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField label="პაროლი" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          შესვლა
        </Button>
      </form>

      <section className="mt-8" aria-labelledby="demo-title">
        <h2 id="demo-title" className="text-sm font-bold uppercase tracking-wide text-muted">
          დემო ანგარიშები
        </h2>
        <p className="mt-1 text-sm text-muted">დააჭირეთ ანგარიშს და ერთი დაწკაპუნებით შეხვალთ. პაროლი ყველასთვის: Demo1234!</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'პაციენტები', icon: <UserRound size={16} aria-hidden />, list: DEMO_ACCOUNTS.patients.map((a) => ({ ...a, sub: a.email.split('@')[0] })) },
            { title: 'ექიმები', icon: <Stethoscope size={16} aria-hidden />, list: DEMO_ACCOUNTS.doctors.map((a) => ({ ...a, sub: a.specialty })) },
            { title: 'ადმინისტრატორი', icon: <ShieldCheck size={16} aria-hidden />, list: [{ ...DEMO_ACCOUNTS.admin, sub: 'admin' }] },
          ].map((g) => (
            <div key={g.title} className="rounded-xl border border-line bg-surface p-3">
              <p className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-brand-dark">
                {g.icon}
                {g.title}
              </p>
              <ul className="space-y-1.5">
                {g.list.map((a) => (
                  <li key={a.email}>
                    <button
                      type="button"
                      disabled={quickBusy !== null}
                      onClick={() => quickLogin(a.email)}
                      className="w-full rounded-lg border border-transparent bg-canvas px-3 py-2 text-left transition-colors hover:border-brand hover:bg-brand-tint disabled:opacity-60"
                    >
                      <span className="block truncate text-sm font-medium">{a.name}</span>
                      <span className="block truncate text-xs text-muted">{quickBusy === a.email ? 'შესვლა...' : a.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
