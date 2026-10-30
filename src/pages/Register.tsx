import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/services/http'
import { registerSchema, type RegisterForm } from '@/utils/validation'
import { TextField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { defaultHome } from '@/utils/roles'
import { tr } from '@/i18n'

export default function Register() {
  const { user, register: signUp } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), mode: 'onTouched' })

  if (user) return <Navigate to={defaultHome(user.role)} replace />

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    try {
      const u = await signUp({ fullName: data.fullName, email: data.email, phone: data.phone || undefined, password: data.password })
      notify(tr("ანგარიში შეიქმნა"))
      navigate(defaultHome(u.role), { replace: true })
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">{tr("რეგისტრაცია")}</h1>
      <p className="mt-1 text-muted">{tr("უკვე გაქვთ ანგარიში?")}{' '}<Link to="/login" className="font-medium text-brand-dark underline">{tr("შედით")}</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-6 shadow-card">
        {serverError && (
          <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}
        <TextField label={tr("სახელი და გვარი")} autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <TextField label={tr("ელ-ფოსტა")} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label={tr("ტელეფონი (არასავალდებულო)")}
          type="tel"
          autoComplete="tel"
          placeholder="+995555123456"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label={tr("პაროლი")}
          type="password"
          autoComplete="new-password"
          hint={tr("მინიმუმ 8 სიმბოლო, ერთი ციფრი და ერთი სპეციალური სიმბოლო")}
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField label={tr("გაიმეორეთ პაროლი")} type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>{tr("ანგარიშის შექმნა")}</Button>
        <p className="text-xs text-muted">{tr("ექიმის და ადმინისტრატორის ანგარიშებს კლინიკის ადმინისტრაცია ქმნის.")}</p>
      </form>
    </div>
  )
}
