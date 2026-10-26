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
import { defaultHome } from '@/utils/roles'

const DEMO = [
  { label: 'პაციენტი', email: 'patient@medibook.ge' },
  { label: 'ექიმი', email: 'doctor@medibook.ge' },
  { label: 'ადმინისტრატორი', email: 'admin@medibook.ge' },
]

export default function Login() {
  const { user, login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  if (user) return <Navigate to={from ?? defaultHome(user.role)} replace />

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    try {
      const u = await login(data.email, data.password)
      notify(`მოგესალმებით, ${u.fullName}`)
      navigate(from ?? defaultHome(u.role), { replace: true })
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">შესვლა</h1>
      <p className="mt-1 text-muted">
        არ გაქვთ ანგარიში?{' '}
        <Link to="/register" className="font-medium text-brand-dark underline">
          დარეგისტრირდით
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-6 shadow-card">
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

      <div className="mt-6 rounded-lg border border-dashed border-line p-4 text-sm">
        <p className="font-medium">სადემონსტრაციო ანგარიშები</p>
        <p className="mt-1 text-muted">პაროლი ყველასთვის: Demo1234!</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              className="rounded-md border border-line bg-surface px-3 py-1.5 hover:border-brand"
              onClick={() => {
                setValue('email', d.email, { shouldValidate: true })
                setValue('password', 'Demo1234!', { shouldValidate: true })
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
