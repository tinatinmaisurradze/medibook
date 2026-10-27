import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { profileService } from '@/services/profileService'
import { errorMessage } from '@/services/http'
import { generalProfileSchema, type GeneralProfileForm } from '@/utils/validation'
import { toISODate } from '@/utils/date'
import { TextField } from './ui/FormField'
import { Button } from './ui/Button'

/** Name, phone and (for patients) birth date and city. The e-mail is the login and cannot be changed here. */
export function GeneralInfoForm({ extended = false }: { extended?: boolean }) {
  const { user, updateUser } = useAuth()
  const { notify } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<GeneralProfileForm>({
    resolver: zodResolver(generalProfileSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      dateOfBirth: user?.dateOfBirth ?? '',
      city: user?.city ?? '',
    },
  })

  if (!user) return null

  const onSubmit = async (data: GeneralProfileForm) => {
    setServerError(null)
    try {
      const updated = await profileService.updateGeneral(data)
      updateUser(updated)
      reset({ fullName: updated.fullName, phone: updated.phone ?? '', dateOfBirth: updated.dateOfBirth ?? '', city: updated.city ?? '' })
      notify('პროფილი განახლდა')
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}
      <TextField label="სახელი და გვარი" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <TextField label="ელ-ფოსტა" value={user.email} readOnly disabled hint="ელ-ფოსტა შესვლისთვის გამოიყენება და აქ ვერ შეიცვლება" />
      <TextField label="ტელეფონი" type="tel" autoComplete="tel" placeholder="+995555123456" error={errors.phone?.message} {...register('phone')} />
      {extended && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="დაბადების თარიღი" type="date" max={toISODate(new Date())} error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
          <TextField label="ქალაქი" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
        </div>
      )}
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        ცვლილებების შენახვა
      </Button>
    </form>
  )
}
