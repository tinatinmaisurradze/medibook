import type { Appointment, Clinic, Doctor, MedicalProfile, Review, SpecialtyKey, User } from '@/types'

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
  reviews: Review[]
  /** medical history keyed by patient id */
  medical: Record<number, MedicalProfile>
  seq: { user: number; appointment: number; review: number }
}

const weekdays = [1, 2, 3, 4, 5]

const clinics: Clinic[] = [
  { id: 1, name: 'MediBook ვაკე', address: 'ჭავჭავაძის გამზ. 33, თბილისი' },
  { id: 2, name: 'MediBook საბურთალო', address: 'ვაჟა-ფშაველას გამზ. 71, თბილისი' },
  { id: 3, name: 'MediBook ბათუმი', address: 'რუსთაველის ქ. 12, ბათუმი' },
]

const doctors: Doctor[] = [
  { id: 1, fullName: 'გიორგი ბერიძე', specialty: 'cardiology', clinicId: 1, rating: 4.8, experienceYears: 18, room: 'კაბინეტი 204', workDays: weekdays, workHours: { start: '09:00', end: '16:00' }, slotMinutes: 30, active: true, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, კარდიოლოგიის რეზიდენტურა', languages: ['ქართული', 'ინგლისური', 'რუსული'], reviewCount: 0, bio: 'ჰიპერტენზიის, გულის უკმარისობისა და არითმიების დიაგნოსტიკა და მკურნალობა. ატარებს ექოკარდიოგრაფიას.' },
  { id: 2, fullName: 'ნათია ხარაიშვილი', specialty: 'pediatrics', clinicId: 1, rating: 4.9, experienceYears: 12, room: 'კაბინეტი 108', workDays: [1, 2, 3, 4, 5, 6], workHours: { start: '10:00', end: '17:00' }, slotMinutes: 30, active: true, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, პედიატრია', languages: ['ქართული', 'ინგლისური'], reviewCount: 0, bio: 'ბავშვთა პრევენციული გასინჯვები, ვაქცინაცია და ხშირად მოავადე ბავშვების დაკვირვება.' },
  { id: 3, fullName: 'დავით მამულაშვილი', specialty: 'neurology', clinicId: 2, rating: 4.6, experienceYears: 15, room: 'კაბინეტი 31', workDays: [1, 3, 5], workHours: { start: '11:00', end: '18:00' }, slotMinutes: 45, active: true, education: 'ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი, ნევროლოგია', languages: ['ქართული', 'რუსული'], reviewCount: 0, bio: 'თავის ტკივილის, თავბრუსხვევისა და ძილის დარღვევების კონსულტაცია.' },
  { id: 4, fullName: 'მარიამ გელაშვილი', specialty: 'dermatology', clinicId: 2, rating: 4.7, experienceYears: 9, room: 'კაბინეტი 27', workDays: [2, 3, 4, 5], workHours: { start: '09:30', end: '15:30' }, slotMinutes: 30, active: true, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, დერმატოვენეროლოგია', languages: ['ქართული', 'ინგლისური', 'გერმანული'], reviewCount: 0, bio: 'აკნეს, ეგზემისა და ხალების დერმატოსკოპიული შემოწმება.' },
  { id: 5, fullName: 'ზურაბ ჯაფარიძე', specialty: 'orthopedics', clinicId: 3, rating: 4.4, experienceYears: 21, room: 'კაბინეტი 5', workDays: weekdays, workHours: { start: '12:00', end: '19:00' }, slotMinutes: 30, active: true, education: 'გრიგოლ რობაქიძის უნივერსიტეტი, ორთოპედია-ტრავმატოლოგია', languages: ['ქართული', 'ინგლისური'], reviewCount: 0, bio: 'სპორტული ტრავმები, სახსრების ტკივილი და რეაბილიტაციის გეგმა.' },
  { id: 6, fullName: 'ლელა წერეთელი', specialty: 'therapy', clinicId: 1, rating: 4.5, experienceYears: 14, room: 'კაბინეტი 110', workDays: weekdays, workHours: { start: '09:00', end: '14:00' }, slotMinutes: 20, active: true, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, ოჯახის მედიცინა', languages: ['ქართული', 'ინგლისური', 'რუსული'], reviewCount: 0, bio: 'პირველადი კონსულტაცია, ანალიზების შეფასება და გადამისამართება სპეციალისტთან.' },
  { id: 7, fullName: 'ანა კვარაცხელია', specialty: 'ophthalmology', clinicId: 3, rating: 4.9, experienceYears: 11, room: 'კაბინეტი 9', workDays: [1, 2, 4, 5], workHours: { start: '10:00', end: '16:00' }, slotMinutes: 30, active: true, education: 'ბათუმის სახელმწიფო უნივერსიტეტი, ოფთალმოლოგია', languages: ['ქართული', 'ინგლისური', 'თურქული'], reviewCount: 0, bio: 'მხედველობის შემოწმება, თვალის წნევის გაზომვა და სათვალის შერჩევა.' },
  { id: 8, fullName: 'ირაკლი სულაბერიძე', specialty: 'cardiology', clinicId: 2, rating: 4.3, experienceYears: 7, room: 'კაბინეტი 33', workDays: [2, 4, 6], workHours: { start: '09:00', end: '15:00' }, slotMinutes: 30, active: true, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, კარდიოლოგია', languages: ['ქართული', 'ინგლისური'], reviewCount: 0, bio: 'ეკგ, დატვირთვითი ტესტები და გულის რისკის შეფასება.' },
]

/** Demo accounts shown on the login page. Password for all of them: Demo1234! */
export const DEMO_ACCOUNTS = {
  patients: [
    { email: 'patient1@medibook.ge', name: 'ნინო გელაშვილი' },
    { email: 'patient2@medibook.ge', name: 'ლევან მაისურაძე' },
    { email: 'patient3@medibook.ge', name: 'თამარ ბაქრაძე' },
  ],
  doctors: [
    { email: 'doctor1@medibook.ge', name: 'გიორგი ბერიძე', specialty: 'კარდიოლოგი' },
    { email: 'doctor2@medibook.ge', name: 'ნათია ხარაიშვილი', specialty: 'პედიატრი' },
    { email: 'doctor3@medibook.ge', name: 'დავით მამულაშვილი', specialty: 'ნევროლოგი' },
  ],
  admin: { email: 'admin@medibook.ge', name: 'ადმინისტრატორი' },
}

const PW = 'Demo1234!'
const users: DbUser[] = [
  { id: 1, fullName: 'ნინო გელაშვილი', email: 'patient1@medibook.ge', phone: '+995555123456', dateOfBirth: '1994-05-12', city: 'თბილისი', role: 'patient', password: PW },
  { id: 2, fullName: 'გიორგი ბერიძე', email: 'doctor1@medibook.ge', phone: '+995599000111', role: 'doctor', doctorId: 1, password: PW },
  { id: 3, fullName: 'ადმინისტრატორი', email: 'admin@medibook.ge', role: 'admin', password: PW },
  { id: 4, fullName: 'ლევან მაისურაძე', email: 'patient2@medibook.ge', phone: '+995577111222', dateOfBirth: '1988-11-03', city: 'თბილისი', role: 'patient', password: PW },
  { id: 5, fullName: 'თამარ ბაქრაძე', email: 'patient3@medibook.ge', dateOfBirth: '1976-02-27', city: 'ბათუმი', role: 'patient', password: PW },
  { id: 6, fullName: 'სანდრო კაპანაძე', email: 'sandro@example.ge', phone: '+995551333444', dateOfBirth: '2001-08-19', city: 'ქუთაისი', role: 'patient', password: PW },
  { id: 7, fullName: 'ნათია ხარაიშვილი', email: 'doctor2@medibook.ge', phone: '+995599222333', role: 'doctor', doctorId: 2, password: PW },
  { id: 8, fullName: 'დავით მამულაშვილი', email: 'doctor3@medibook.ge', phone: '+995599444555', role: 'doctor', doctorId: 3, password: PW },
]

export function createSeedDb(): Db {
  const today = new Date()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dayOffset = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return iso(d)
  }
  /** first date on or after today + minOffset on which the doctor works */
  const workday = (doctorId: number, minOffset: number) => {
    const doctor = doctors.find((d) => d.id === doctorId)!
    for (let i = minOffset; i < minOffset + 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      if (doctor.workDays.includes(d.getDay())) return iso(d)
    }
    return dayOffset(minOffset)
  }
  const ago = (days: number) => new Date(today.getTime() - days * 864e5).toISOString()

  const appointments: Appointment[] = []
  const reviews: Review[] = []
  const add = (a: Omit<Appointment, 'id' | 'createdAt'> & { createdDaysAgo?: number }): Appointment => {
    const { createdDaysAgo = 7, ...rest } = a
    const appt: Appointment = { ...rest, id: appointments.length + 1, createdAt: ago(createdDaysAgo) }
    appointments.push(appt)
    return appt
  }
  const rate = (appt: Appointment, rating: number, daysAgo: number) =>
    reviews.push({ id: reviews.length + 1, doctorId: appt.doctorId, patientId: appt.patientId, appointmentId: appt.id, rating, createdAt: ago(daysAgo) })

  // ----- history -----
  const h1 = add({ doctorId: 1, patientId: 1, date: dayOffset(-14), time: '10:00', reason: 'წნევის პერიოდული მატება', status: 'completed', diagnosis: 'არტერიული ჰიპერტენზია, I ხარისხი', prescription: 'დღეში 1 ტაბლეტი ამლოდიპინი 5 მგ, წნევის დღიური' })
  add({ doctorId: 4, patientId: 1, date: dayOffset(-5), time: '09:30', status: 'cancelled' })
  const h2 = add({ doctorId: 1, patientId: 4, date: dayOffset(-30), time: '09:30', reason: 'გულისცემის აჩქარება', status: 'completed', diagnosis: 'სინუსური ტაქიკარდია, რეკომენდებულია ეკგ მონიტორინგი', prescription: 'კოფეინის შემცირება, 24-საათიანი ჰოლტერი' })
  const h3 = add({ doctorId: 1, patientId: 5, date: dayOffset(-21), time: '11:30', reason: 'გულმკერდის დისკომფორტი', status: 'completed', diagnosis: 'კუნთოვანი ტკივილი, გულის პათოლოგია არ დასტურდება', prescription: 'ფიზიკური დატვირთვის რეჟიმი, განმეორებითი ვიზიტი 1 თვეში' })
  const h4 = add({ doctorId: 1, patientId: 6, date: dayOffset(-9), time: '14:00', reason: 'სპორტული ექიმის ცნობა', status: 'completed', diagnosis: 'პრაქტიკულად ჯანმრთელი', prescription: 'ცნობა გაცემულია' })
  const h5 = add({ doctorId: 1, patientId: 6, date: dayOffset(-40), time: '12:00', reason: 'ეკგ', status: 'completed', diagnosis: 'ნორმა', prescription: 'დამატებითი გამოკვლევა საჭირო არ არის' })
  const h6 = add({ doctorId: 1, patientId: 4, date: dayOffset(-55), time: '15:00', reason: 'პირველადი კონსულტაცია', status: 'completed', diagnosis: 'გულისცემის პერიოდული აჩქარება', prescription: 'ეკგ და სისხლის ანალიზი' })
  const h7 = add({ doctorId: 1, patientId: 5, date: dayOffset(-70), time: '10:30', reason: 'წნევა', status: 'completed', diagnosis: 'დროებითი მატება სტრესის ფონზე', prescription: 'წნევის დღიური 2 კვირა' })
  const h8 = add({ doctorId: 2, patientId: 4, date: dayOffset(-12), time: '10:30', reason: 'შვილის ვაქცინაცია', status: 'completed', diagnosis: 'ვაქცინაცია ჩატარებულია', prescription: 'დაკვირვება 48 საათის განმავლობაში' })
  const h9 = add({ doctorId: 3, patientId: 5, date: dayOffset(-16), time: '12:00', reason: 'თავის ტკივილი', status: 'completed', diagnosis: 'დაძაბულობის ტიპის თავის ტკივილი', prescription: 'ძილის რეჟიმი, მაგნიუმის შემცველი პრეპარატი' })
  rate(h1, 5, 13); rate(h2, 5, 29); rate(h3, 4, 20); rate(h4, 5, 8); rate(h5, 5, 39); rate(h6, 4, 54); rate(h7, 3, 69)
  rate(h8, 5, 11); rate(h9, 4, 15)

  // ----- today and the coming days (always on days the doctor really works) -----
  add({ doctorId: 1, patientId: 4, date: workday(1, 0), time: '10:30', reason: 'განმეორებითი ვიზიტი', status: 'confirmed' })
  add({ doctorId: 1, patientId: 5, date: workday(1, 0), time: '12:00', reason: 'ანალიზების შედეგები', status: 'confirmed' })
  add({ doctorId: 1, patientId: 1, date: workday(1, 0), time: '14:30', reason: 'წნევის კონტროლი', status: 'confirmed' })
  add({ doctorId: 1, patientId: 6, date: workday(1, 1), time: '09:30', reason: 'გულისცემა დატვირთვისას', status: 'confirmed' })
  add({ doctorId: 2, patientId: 1, date: workday(2, 1), time: '11:00', reason: 'ყოველწლიური გასინჯვა', status: 'confirmed' })
  add({ doctorId: 2, patientId: 5, date: workday(2, 1), time: '12:30', reason: 'ბავშვის გასინჯვა', status: 'confirmed' })
  add({ doctorId: 3, patientId: 4, date: workday(3, 0), time: '12:30', reason: 'თავბრუსხვევა', status: 'confirmed' })

  const medical: Record<number, MedicalProfile> = {
    1: { bloodType: 'A+', heightCm: 168, weightKg: 62, allergies: ['პენიცილინი'], chronicConditions: ['არტერიული ჰიპერტენზია'], medications: ['ამლოდიპინი 5 მგ'], surgeries: [], familyHistory: 'დედის მხრიდან ჰიპერტენზია.', sharedWithDoctors: true, updatedAt: ago(14) },
    4: { bloodType: 'O+', heightCm: 181, weightKg: 84, allergies: ['ლატექსი', 'მტვერი'], chronicConditions: ['ბრონქული ასთმა'], medications: ['სალბუტამოლი საჭიროებისას'], surgeries: ['აპენდექტომია, 2015'], familyHistory: '', sharedWithDoctors: true, updatedAt: ago(30) },
    // this patient keeps the medical history private: doctors see a "not shared" notice
    5: { bloodType: 'B-', heightCm: 164, weightKg: 70, allergies: ['იოდი'], chronicConditions: [], medications: [], surgeries: [], familyHistory: '', sharedWithDoctors: false, updatedAt: ago(60) },
  }

  return { users, clinics, doctors, appointments, reviews, medical, seq: { user: 9, appointment: appointments.length + 1, review: reviews.length + 1 } }
}
