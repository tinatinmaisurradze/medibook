import { Link } from 'react-router-dom'
import { tr } from '@/i18n'

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-6xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold">{tr("გვერდი ვერ მოიძებნა")}</h1>
      <p className="mt-2 text-muted">{tr("მისამართი შეიძლება შეცვლილია ან არასწორია.")}</p>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark">{tr("მთავარ გვერდზე")}</Link>
    </div>
  )
}

export function Forbidden() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-6xl font-bold text-danger">403</p>
      <h1 className="mt-3 text-2xl font-bold">{tr("წვდომა შეზღუდულია")}</h1>
      <p className="mt-2 text-muted">{tr("ამ გვერდის სანახავად თქვენს როლს უფლება არ აქვს.")}</p>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark">{tr("მთავარ გვერდზე")}</Link>
    </div>
  )
}
