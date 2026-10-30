import { GeneralInfoForm } from '@/components/GeneralInfoForm'
import { PasswordForm } from '@/components/PasswordForm'
import { tr } from '@/i18n'

export default function AdminProfile() {
  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("ჩემი პროფილი")}</h1>
      <div className="mt-6 space-y-6">
        <section className="rounded-lg border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold">{tr("პირადი ინფორმაცია")}</h2>
          <GeneralInfoForm />
        </section>
        <section className="rounded-lg border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold">{tr("პაროლის შეცვლა")}</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  )
}
