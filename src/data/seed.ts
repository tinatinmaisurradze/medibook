import type { Appointment, Clinic, Doctor, SpecialtyKey, User } from '@/types'

export const SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
  therapy: 'თერაპევტი',
  cardiology: 'კარდიოლოგი',
  pediatrics: 'პედიატრი',
  dermatology: 'დერმატოლოგი',
  neurology: 'ნევროლოგი',
  orthopedics: 'ორთოპედი',
  ophthalmology: 'ოკულისტი',
}

export interface DbUser extends User {
  password: string
}

export interface Db {
  users: DbUser[]
  clinics: Clinic[]
  doctors: Doctor[]
  appointments: Appointment[]
  seq: { user: number; appointment: number }
}

const weekdays = [1, 2, 3, 4, 5]

const clinics: Clinic[] = [
  { id: 1, name: 'MediBook ვაკე', address: 'ჭავჭავაძის გამზ. 33, თბილისი' },
  { id: 2, name: 'MediBook საბურთალო', address: 'ვაჟა-ფშაველას გამზ. 71, თბილისი' },
  { id: 3, name: 'MediBook ბათუმი', address: 'რუსთაველის ქ. 12, ბათუმი' },
]

const doctors: Doctor[] = [
  { id: 1, fullName: 'გიორგი ბერიძე', specialty: 'cardiology', clinicId: 1, rating: 4.8, experienceYears: 18, room: 'კაბინეტი 204', workDays: weekdays, workHours: { start: '09:00', end: '16:00' }, slotMinutes: 30, active: true, bio: 'ჰიპერტენზიის, გულის უკმარისობისა და არითმიების დიაგნოსტიკა და მკურნალობა. ატარებს ექოკარდიოგრაფიას.' },
  { id: 2, fullName: 'ნათია ხარაიშვილი', specialty: 'pediatrics', clinicId: 1, rating: 4.9, experienceYears: 12, room: 'კაბინეტი 108', workDays: [1, 2, 3, 4, 5, 6], workHours: { start: '10:00', end: '17:00' }, slotMinutes: 30, active: true, bio: 'ბავშვთა პრევენციული გასინჯვები, ვაქცინაცია და ხშირად მოავადე ბავშვების დაკვირვება.' },
  { id: 3, fullName: 'დავით მამულაშვილი', specialty: 'neurology', clinicId: 2, rating: 4.6, experienceYears: 15, room: 'კაბინეტი 31', workDays: [1, 3, 5], workHours: { start: '11:00', end: '18:00' }, slotMinutes: 45, active: true, bio: 'თავის ტკივილის, თავბრუსხვევისა და ძილის დარღვევების კონსულტაცია.' },
  { id: 4, fullName: 'მარიამ გელაშვილი', specialty: 'dermatology', clinicId: 2, rating: 4.7, experienceYears: 9, room: 'კაბინეტი 27', workDays: [2, 3, 4, 5], workHours: { start: '09:30', end: '15:30' }, slotMinutes: 30, active: true, bio: 'აკნეს, ეგზემისა და ხალების დერმატოსკოპიული შემოწმება.' },
  { id: 5, fullName: 'ზურაბ ჯაფარიძე', specialty: 'orthopedics', clinicId: 3, rating: 4.4, experienceYears: 21, room: 'კაბინეტი 5', workDays: weekdays, workHours: { start: '12:00', end: '19:00' }, slotMinutes: 30, active: true, bio: 'სპორტული ტრავმები, სახსრების ტკივილი და რეაბილიტაციის გეგმა.' },
  { id: 6, fullName: 'ლელა წერეთელი', specialty: 'therapy', clinicId: 1, rating: 4.5, experienceYears: 14, room: 'კაბინეტი 110', workDays: weekdays, workHours: { start: '09:00', end: '14:00' }, slotMinutes: 20, active: true, bio: 'პირველადი კონსულტაცია, ანალიზების შეფასება და გადამისამართება სპეციალისტთან.' },
  { id: 7, fullName: 'ანა კვარაცხელია', specialty: 'ophthalmology', clinicId: 3, rating: 4.9, experienceYears: 11, room: 'კაბინეტი 9', workDays: [1, 2, 4, 5], workHours: { start: '10:00', end: '16:00' }, slotMinutes: 30, active: true, bio: 'მხედველობის შემოწმება, თვალის წნევის გაზომვა და სათვალის შერჩევა.' },
  { id: 8, fullName: 'ირაკლი სულაბერიძე', specialty: 'cardiology', clinicId: 2, rating: 4.3, experienceYears: 7, room: 'კაბინეტი 33', workDays: [2, 4, 6], workHours: { start: '09:00', end: '15:00' }, slotMinutes: 30, active: true, bio: 'ეკგ, დატვირთვითი ტესტები და გულის რისკის შეფასება.' },
]

const users: DbUser[] = [
  { id: 1, fullName: 'ნინო გელაშვილი', email: 'patient@medibook.ge', phone: '+995555123456', role: 'patient', password: 'Demo1234!' },
  { id: 2, fullName: 'გიორგი ბერიძე', email: 'doctor@medibook.ge', role: 'doctor', doctorId: 1, password: 'Demo1234!' },
  { id: 3, fullName: 'ადმინისტრატორი', email: 'admin@medibook.ge', role: 'admin', password: 'Demo1234!' },
]

export function createSeedDb(): Db {
  const today = new Date()
  const iso = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const appointments: Appointment[] = [
    { id: 1, doctorId: 1, patientId: 1, date: iso(-14), time: '10:00', reason: 'ზეწოლის პერიოდული მატება', status: 'completed', diagnosis: 'არტერიული ჰიპერტენზია, I ხარისხი', prescription: 'დღეში 1 ტაბლეტი ამლოდიპინი 5 მგ, წნევის დღიური', createdAt: new Date(today.getTime() - 20 * 864e5).toISOString() },
    { id: 2, doctorId: 2, patientId: 1, date: iso(3), time: '11:00', reason: 'ყოველწლიური გასინჯვა', status: 'confirmed', createdAt: new Date().toISOString() },
    { id: 3, doctorId: 4, patientId: 1, date: iso(-5), time: '09:30', status: 'cancelled', createdAt: new Date(today.getTime() - 9 * 864e5).toISOString() },
  ]
  return { users, clinics, doctors, appointments, seq: { user: 4, appointment: 4 } }
}
