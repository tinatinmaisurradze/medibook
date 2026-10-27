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

const users: DbUser[] = [
  { id: 1, fullName: 'ნინო გელაშვილი', email: 'patient1@medibook.ge', phone: '+995555123456', dateOfBirth: '1994-05-12', city: 'თბილისი', role: 'patient', password: 'Demo1234!' },
  { id: 2, fullName: 'გიორგი ბერიძე', email: 'doctor1@medibook.ge', phone: '+995599000111', role: 'doctor', doctorId: 1, password: 'Demo1234!' },
  { id: 3, fullName: 'ადმინისტრატორი', email: 'admin@medibook.ge', role: 'admin', password: 'Demo1234!' },
  { id: 4, fullName: 'ლევან მაისურაძე', email: 'patient2@medibook.ge', phone: '+995577111222', dateOfBirth: '1988-11-03', city: 'თბილისი', role: 'patient', password: 'Demo1234!' },
  { id: 5, fullName: 'თამარ ბაქრაძე', email: 'patient3@medibook.ge', dateOfBirth: '1976-02-27', city: 'ბათუმი', role: 'patient', password: 'Demo1234!' },
  { id: 6, fullName: 'სანდრო კაპანაძე', email: 'sandro@example.ge', phone: '+995551333444', dateOfBirth: '2001-08-19', city: 'ქუთაისი', role: 'patient', password: 'Demo1234!' },
  { id: 7, fullName: 'ნათია ხარაიშვილი', email: 'doctor2@medibook.ge', phone: '+995599222333', role: 'doctor', doctorId: 2, password: 'Demo1234!' },
  { id: 8, fullName: 'დავით მამულაშვილი', email: 'doctor3@medibook.ge', phone: '+995599444555', role: 'doctor', doctorId: 3, password: 'Demo1234!' },
]

export function createSeedDb(): Db {
  const today = new Date()
  const iso = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const ago = (days: number) => new Date(today.getTime() - days * 864e5).toISOString()

  const appointments: Appointment[] = [
    { id: 1, doctorId: 1, patientId: 1, date: iso(-14), time: '10:00', reason: 'ზეწოლის პერიოდული მატება', status: 'completed', diagnosis: 'არტერიული ჰიპერტენზია, I ხარისხი', prescription: 'დღეში 1 ტაბლეტი ამლოდიპინი 5 მგ, წნევის დღიური', createdAt: ago(20) },
    { id: 2, doctorId: 2, patientId: 1, date: iso(3), time: '11:00', reason: 'ყოველწლიური გასინჯვა', status: 'confirmed', createdAt: ago(0) },
    { id: 3, doctorId: 4, patientId: 1, date: iso(-5), time: '09:30', status: 'cancelled', createdAt: ago(9) },
    { id: 4, doctorId: 1, patientId: 4, date: iso(-30), time: '09:30', reason: 'გულისცემის აჩქარება', status: 'completed', diagnosis: 'სინუსური ტაქიკარდია, რეკომენდებულია ეკგ მონიტორინგი', prescription: 'კოფეინის შემცირება, 24-საათიანი ჰოლტერი', createdAt: ago(35) },
    { id: 5, doctorId: 1, patientId: 5, date: iso(-21), time: '11:30', reason: 'გულმკერდის დისკომფორტი', status: 'completed', diagnosis: 'კუნთოვანი ტკივილი, გულის პათოლოგია არ დასტურდება', prescription: 'ფიზიკური დატვირთვის რეჟიმი, განმეორებითი ვიზიტი 1 თვეში', createdAt: ago(25) },
    { id: 6, doctorId: 1, patientId: 6, date: iso(-9), time: '14:00', reason: 'სპორტული ექიმის ცნობა', status: 'completed', diagnosis: 'პრაქტიკულად ჯანმრთელი', prescription: 'ცნობა გაცემულია', createdAt: ago(12) },
    { id: 7, doctorId: 2, patientId: 4, date: iso(-12), time: '10:30', reason: 'შვილის ვაქცინაცია', status: 'completed', diagnosis: 'ვაქცინაცია ჩატარებულია', prescription: 'დაკვირვება 48 საათის განმავლობაში', createdAt: ago(15) },
    { id: 8, doctorId: 3, patientId: 5, date: iso(-16), time: '12:00', reason: 'თავის ტკივილი', status: 'completed', diagnosis: 'დაძაბულობის ტიპის თავის ტკივილი', prescription: 'ძილის რეჟიმი, მაგნიუმის შემცველი პრეპარატი', createdAt: ago(20) },
    { id: 9, doctorId: 1, patientId: 4, date: iso(2), time: '10:00', reason: 'განმეორებითი ვიზიტი', status: 'confirmed', createdAt: ago(1) },
  ]

  const reviews: Review[] = [
    { id: 1, doctorId: 1, patientId: 1, appointmentId: 1, rating: 5, comment: 'ძალიან ყურადღებიანი ექიმია, ყველაფერი დეტალურად ამიხსნა და გეგმა დამიწერა.', createdAt: ago(13), doctorReply: 'გმადლობთ! გისურვებთ კარგ თვითგრძნობას.', doctorReplyAt: ago(12) },
    { id: 2, doctorId: 1, patientId: 4, appointmentId: 4, rating: 5, comment: 'სწრაფი დიაგნოსტიკა და გასაგები რეკომენდაციები.', createdAt: ago(29) },
    { id: 3, doctorId: 1, patientId: 5, appointmentId: 5, rating: 4, comment: 'კარგი სპეციალისტია, მხოლოდ რიგში ცოტა დავიცადე.', createdAt: ago(20) },
    { id: 4, doctorId: 1, patientId: 6, appointmentId: 6, rating: 5, createdAt: ago(8) },
    { id: 5, doctorId: 2, patientId: 4, appointmentId: 7, rating: 5, comment: 'ბავშვი ექიმთან არ შეშინებულა, ძალიან კეთილია.', createdAt: ago(11) },
    { id: 6, doctorId: 3, patientId: 5, appointmentId: 8, rating: 4, comment: 'დეტალური კონსულტაცია.', createdAt: ago(15) },
  ]

  const medical: Record<number, MedicalProfile> = {
    1: {
      bloodType: 'A+',
      heightCm: 168,
      weightKg: 62,
      allergies: ['პენიცილინი'],
      chronicConditions: ['არტერიული ჰიპერტენზია'],
      medications: ['ამლოდიპინი 5 მგ'],
      surgeries: [],
      familyHistory: 'დედის მხრიდან ჰიპერტენზია.',
      sharedWithDoctors: true,
      updatedAt: ago(14),
    },
  }

  return { users, clinics, doctors, appointments, reviews, medical, seq: { user: 9, appointment: 10, review: 7 } }
}
