import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { profileService } from '@/services/profileService'
import { GeneralInfoForm } from '@/components/GeneralInfoForm'
import { MedicalForm } from '@/components/MedicalForm'
import { PasswordForm } from '@/components/PasswordForm'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState } from '@/components/ui/States'
import type { MedicalProfile } from '@/types'

type Tab = 'general' | 'medical' | 'security'

export default function PatientProfile() {
  const [params] = useSearchParams()
  const initial = params.get('tab')
  const [tab, setTab] = useState<Tab>(initial === 'medical' || initial === 'security' ? initial : 'general')
  const profile = useAsync(() => profileService.get(), [])
  const [saved, setSaved] = useState<MedicalProfile | null>(null)

  return (
    <div>
      <h1 className="text-3xl font-bold">ჩემი პროფილი</h1>
      <p className="mt-1 text-muted">პირადი ინფორმაცია, სამედიცინო ისტორია და უსაფრთხოება.</p>

      <div className="mt-6">
        <Tabs
          label="პროფილის განყოფილებები"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'general', label: 'ზოგადი ინფორმაცია' },
            { id: 'medical', label: 'სამედიცინო ისტორია' },
            { id: 'security', label: 'უსაფრთხოება' },
          ]}
        />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface p-6 shadow-card">
        {tab === 'general' && <GeneralInfoForm extended />}

        {tab === 'medical' && (
          <>
            {profile.loading && <div className="skeleton h-64 w-full" aria-hidden />}
            {profile.error && <ErrorState message={profile.error} onRetry={profile.reload} />}
            {profile.data && <MedicalForm initial={saved ?? profile.data.medicalProfile} onSaved={setSaved} />}
          </>
        )}

        {tab === 'security' && (
          <>
            <h2 className="mb-4 text-xl font-bold">პაროლის შეცვლა</h2>
            <PasswordForm />
          </>
        )}
      </div>
    </div>
  )
}
