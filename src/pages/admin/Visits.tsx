import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import { VisitHistory } from '@/components/VisitHistory'
import { tr } from '@/i18n'

/** All visits of all clinics with filters and pages. Medical content is never shown or searchable here. */
export default function AdminVisits() {
  const clinics = useAsync(() => doctorService.clinics(), [])
  const doctors = useAsync(() => adminService.doctors(), [])
  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("ვიზიტები")}</h1>
      <p className="mb-6 mt-1 text-muted">{tr("ყველა კლინიკის ვიზიტები და გადახდების სტატუსი. სამედიცინო ჩანაწერები ადმინისტრატორს არ ჩანს.")}</p>
      <VisitHistory fetcher={adminService.visits} perspective="admin" clinics={clinics.data ?? []} doctors={(doctors.data ?? []).map((d) => ({ id: d.id, fullName: d.fullName }))} showSpecialty pageSize={15} />
    </div>
  )
}
