import type { MedicalProfile } from '@/types'
import { tr } from '@/i18n'

function List({ items, tone }: { items: string[]; tone?: 'danger' }) {
  if (items.length === 0) return <span className="text-muted">{tr("არ არის მითითებული")}</span>
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i} className={`rounded-full px-3 py-0.5 text-sm ${tone === 'danger' ? 'bg-danger-tint text-danger' : 'bg-brand-tint text-brand-dark'}`}>
          {i}
        </li>
      ))}
    </ul>
  )
}

/** Read-only view of a patient's medical history (used on the doctor's patient page) */
export function MedicalSummary({ profile }: { profile: MedicalProfile }) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted">{tr("სისხლის ჯგუფი")}</dt>
        <dd className="mt-1 font-medium">{profile.bloodType || '—'}</dd>
      </div>
      <div>
        <dt className="text-muted">{tr("სიმაღლე / წონა")}</dt>
        <dd className="mt-1 font-medium">
          {profile.heightCm ? tr("{0} სმ", [profile.heightCm]) : '—'} / {profile.weightKg ? tr("{0} კგ", [profile.weightKg]) : '—'}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="mb-1 text-muted">{tr("ალერგიები")}</dt>
        <dd>
          <List items={profile.allergies} tone="danger" />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="mb-1 text-muted">{tr("ქრონიკული დაავადებები")}</dt>
        <dd>
          <List items={profile.chronicConditions} />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="mb-1 text-muted">{tr("მიმდინარე მედიკამენტები")}</dt>
        <dd>
          <List items={profile.medications} />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="mb-1 text-muted">{tr("ოპერაციები და ტრავმები")}</dt>
        <dd>
          <List items={profile.surgeries} />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted">{tr("ოჯახური ანამნეზი")}</dt>
        <dd className="mt-1 whitespace-pre-wrap break-words">{profile.familyHistory || '—'}</dd>
      </div>
    </dl>
  )
}
