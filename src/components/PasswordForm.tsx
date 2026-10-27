import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileService } from '@/services/profileService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { passwordChangeSchema, type PasswordChangeForm } from '@/utils/validation'
import { TextField } from './ui/FormField'
import { Button } from './ui/Button'

export function PasswordForm() {
  const { notify } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeForm>({ resolver: zodResolver(passwordChangeSchema), mode: 'onTouched' })

  const onSubmit = async (data: PasswordChangeForm) => {
    setServerError(null)
    try {
      await profileService.changePassword(data)
      notify('პაროლი შეიცვალა')
      reset()
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}
      <TextField label="მიმდინარე პაროლი" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <TextField
        label="ახალი პაროლი"
        type="password"
        autoComplete="new-password"
        hint="მინიმუმ 8 სიმბოლო, ერთი ციფრი და ერთი სპეციალური სიმბოლო"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField label="გაიმეორეთ ახალი პაროლი" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" loading={isSubmitting}>
        პაროლის შეცვლა
      </Button>
    </form>
  )
}
