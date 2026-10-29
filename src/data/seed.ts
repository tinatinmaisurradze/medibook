import type {
  Appointment,
  AppointmentStatus,
  Clinic,
  Doctor,
  DoctorLocation,
  DoctorService,
  MedicalProfile,
  PaymentStatus,
  Review,
  SpecialtyKey,
  User,
} from '@/types'

export const SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
  therapy: 'თერაპევტი',
  cardiology: 'კარდიოლოგი',
  pediatrics: 'პედიატრი',
  dermatology: 'დერმატოლოგი',
  neurology: 'ნევროლოგი',
  orthopedics: 'ორთოპედი',
  ophthalmology: 'ოკულისტი',
}

/** How a doctor is stored: the API adds the derived summary fields and the services */
export type DbDoctor = Omit<Doctor, 'clinicId' | 'room' | 'workDays' | 'workHours' | 'slotMinutes' | 'services' | 'priceFrom' | 'nextAvailable'>

export interface DbUser extends User {
  password: string
}

export interface Db {
  users: DbUser[]
  clinics: Clinic[]
  doctors: DbDoctor[]
  services: DoctorService[]
  appointments: Appointment[]
  reviews: Review[]
  /** medical history keyed by patient id */
  medical: Record<number, MedicalProfile>
  seq: { user: number; appointment: number; review: number; service: number; location: number }
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

/**
 * Demo data. Network names are used as realistic examples only; addresses are made up.
 * 13 clinics in Tbilisi (by district) and 7 in Batumi.
 */
const TBILISI = { region: 'თბილისი', city: 'თბილისი' }
const BATUMI = { region: 'აჭარა', city: 'ბათუმი', municipality: 'ბათუმი' }
const clinics: Clinic[] = [
  { id: 1, name: 'ევექსი საბურთალო', network: 'ევექსი', address: 'ვაჟა-ფშაველას გამზ. 71', ...TBILISI, municipality: 'საბურთალო' },
  { id: 2, name: 'ევექსი ვაკე', network: 'ევექსი', address: 'ჭავჭავაძის გამზ. 33', ...TBILISI, municipality: 'ვაკე' },
  { id: 3, name: 'ევექსი ისანი', network: 'ევექსი', address: 'სამგორის ქ. 12', ...TBILISI, municipality: 'ისანი' },
  { id: 4, name: 'ევექსი დიღომი', network: 'ევექსი', address: 'დიღმის მასივი, III კვარტალი', ...TBILISI, municipality: 'დიღომი' },
  { id: 5, name: 'ავერსი ვაკე', network: 'ავერსი', address: 'პეკინის გამზ. 8', ...TBILISI, municipality: 'ვაკე' },
  { id: 6, name: 'ავერსი საბურთალო', network: 'ავერსი', address: 'წინამძღვრიშვილის ქ. 19', ...TBILISI, municipality: 'საბურთალო' },
  { id: 7, name: 'ავერსი გლდანი', network: 'ავერსი', address: 'გლდანის მასივი, V მიკრორაიონი', ...TBILISI, municipality: 'გლდანი' },
  { id: 8, name: 'მედიქალი ნაძალადევი', network: 'მედიქალი', address: 'წერეთლის გამზ. 44', ...TBILISI, municipality: 'ნაძალადევი' },
  { id: 9, name: 'მედიქალი ვერე', network: 'მედიქალი', address: 'ბარნოვის ქ. 5', ...TBILISI, municipality: 'ვერე' },
  { id: 10, name: 'მედიქალი ისანი', network: 'მედიქალი', address: 'მეტეხის ქ. 21', ...TBILISI, municipality: 'ისანი' },
  { id: 11, name: 'ჯანმრთელობის ცენტრი მთაწმინდა', network: 'ჯანმრთელობის ცენტრი', address: 'ჭონქაძის ქ. 3', ...TBILISI, municipality: 'მთაწმინდა' },
  { id: 12, name: 'ჯანმრთელობის ცენტრი კრწანისი', network: 'ჯანმრთელობის ცენტრი', address: 'ჭავჭავაძის ქ. 90', ...TBILISI, municipality: 'კრწანისი' },
  { id: 13, name: 'ჯანმრთელობის ცენტრი ჩუღურეთი', network: 'ჯანმრთელობის ცენტრი', address: 'ახმეტელის გამზ. 17', ...TBILISI, municipality: 'ჩუღურეთი' },
  { id: 14, name: 'ევექსი ბათუმი', network: 'ევექსი', address: 'ჭავჭავაძის ქ. 25', ...BATUMI },
  { id: 15, name: 'ავერსი ბათუმი ცენტრი', network: 'ავერსი', address: 'რუსთაველის ქ. 14', ...BATUMI },
  { id: 16, name: 'ავერსი ბათუმი ბულვარი', network: 'ავერსი', address: 'ახალი ბულვარი, 6', ...BATUMI },
  { id: 17, name: 'მედიქალი ბათუმი', network: 'მედიქალი', address: 'ზუბალაშვილის ქ. 30', ...BATUMI },
  { id: 18, name: 'მედიქალი ბათუმი 2', network: 'მედიქალი', address: 'გორგილაძის ქ. 71', ...BATUMI },
  { id: 19, name: 'ჯანმრთელობის ცენტრი ბათუმი', network: 'ჯანმრთელობის ცენტრი', address: 'აბაშიძის ქ. 48', ...BATUMI },
  { id: 20, name: 'ჯანმრთელობის ცენტრი ბათუმი 2', network: 'ჯანმრთელობის ცენტრი', address: 'ფარნავაზ მეფის ქ. 9', ...BATUMI },
]

const WEEKDAYS = [1, 2, 3, 4, 5]
let locationSeq = 1
const loc = (clinicId: number, room: string, days: number[], start: string, end: string, slotMinutes = 30): DoctorLocation => ({
  id: locationSeq++,
  clinicId,
  room,
  days,
  start,
  end,
  slotMinutes,
})

/** city and region of a doctor come from the clinics where the doctor works (all in one city) */
const geo = (clinicId: number) => {
  const c = clinics.find((x) => x.id === clinicId)!
  return { city: c.city, region: c.region }
}

const doctors: DbDoctor[] = [
  { id: 1, fullName: 'გიორგი ბერიძე', specialty: 'cardiology', rating: 4.8, experienceYears: 18, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, კარდიოლოგიის რეზიდენტურა', languages: ['ქართული', 'ინგლისური', 'რუსული'], bio: 'ჰიპერტენზიის, გულის უკმარისობისა და არითმიების დიაგნოსტიკა და მკურნალობა. ატარებს ექოკარდიოგრაფიას.', ...geo(1), locations: [loc(1, 'კაბინეტი 204', [1, 3, 5], '09:00', '14:00'), loc(5, 'კაბინეტი 15', [2, 4], '12:00', '18:00')] },
  { id: 2, fullName: 'ნათია ხარაიშვილი', specialty: 'pediatrics', rating: 4.9, experienceYears: 12, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, პედიატრია', languages: ['ქართული', 'ინგლისური'], bio: 'ბავშვთა პრევენციული გასინჯვები, ვაქცინაცია და ხშირად მოავადე ბავშვების დაკვირვება.', ...geo(2), locations: [loc(2, 'კაბინეტი 108', WEEKDAYS, '10:00', '15:00'), loc(8, 'კაბინეტი 3', [6], '10:00', '16:00')] },
  { id: 3, fullName: 'დავით მამულაშვილი', specialty: 'neurology', rating: 4.6, experienceYears: 15, active: true, reviewCount: 0, education: 'ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი, ნევროლოგია', languages: ['ქართული', 'რუსული'], bio: 'თავის ტკივილის, თავბრუსხვევისა და ძილის დარღვევების კონსულტაცია.', ...geo(6), locations: [loc(6, 'კაბინეტი 31', [1, 3, 5], '11:00', '18:00', 45)] },
  { id: 4, fullName: 'მარიამ გელაშვილი', specialty: 'dermatology', rating: 4.7, experienceYears: 9, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, დერმატოვენეროლოგია', languages: ['ქართული', 'ინგლისური', 'გერმანული'], bio: 'აკნეს, ეგზემისა და ხალების დერმატოსკოპიული შემოწმება.', ...geo(3), locations: [loc(3, 'კაბინეტი 27', [2, 3, 4, 5], '09:30', '15:30')] },
  { id: 5, fullName: 'ზურაბ ჯაფარიძე', specialty: 'orthopedics', rating: 4.4, experienceYears: 21, active: true, reviewCount: 0, education: 'გრიგოლ რობაქიძის უნივერსიტეტი, ორთოპედია-ტრავმატოლოგია', languages: ['ქართული', 'ინგლისური'], bio: 'სპორტული ტრავმები, სახსრების ტკივილი და რეაბილიტაციის გეგმა.', ...geo(14), locations: [loc(14, 'კაბინეტი 5', WEEKDAYS, '12:00', '19:00'), loc(15, 'კაბინეტი 112', [6], '10:00', '14:00')] },
  { id: 6, fullName: 'ლელა წერეთელი', specialty: 'therapy', rating: 4.5, experienceYears: 14, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, ოჯახის მედიცინა', languages: ['ქართული', 'ინგლისური', 'რუსული'], bio: 'პირველადი კონსულტაცია, ანალიზების შეფასება და გადამისამართება სპეციალისტთან.', ...geo(4), locations: [loc(4, 'კაბინეტი 110', WEEKDAYS, '09:00', '14:00', 20)] },
  { id: 7, fullName: 'ანა კვარაცხელია', specialty: 'ophthalmology', rating: 4.9, experienceYears: 11, active: true, reviewCount: 0, education: 'ბათუმის სახელმწიფო უნივერსიტეტი, ოფთალმოლოგია', languages: ['ქართული', 'ინგლისური', 'თურქული'], bio: 'მხედველობის შემოწმება, თვალის წნევის გაზომვა და სათვალის შერჩევა.', ...geo(17), locations: [loc(17, 'კაბინეტი 9', [1, 2, 4, 5], '10:00', '16:00')] },
  { id: 8, fullName: 'ირაკლი სულაბერიძე', specialty: 'cardiology', rating: 4.3, experienceYears: 7, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, კარდიოლოგია', languages: ['ქართული', 'ინგლისური'], bio: 'ეკგ, დატვირთვითი ტესტები და გულის რისკის შეფასება.', ...geo(7), locations: [loc(7, 'კაბინეტი 33', [2, 4, 6], '09:00', '15:00'), loc(9, 'კაბინეტი 14', [3], '10:00', '14:00')] },
  { id: 9, fullName: 'თამარ ლომიძე', specialty: 'therapy', rating: 4.6, experienceYears: 10, active: true, reviewCount: 0, education: 'ბათუმის სახელმწიფო უნივერსიტეტი, ოჯახის მედიცინა', languages: ['ქართული', 'ინგლისური'], bio: 'პირველადი კონსულტაცია, ქრონიკული დაავადებების მონიტორინგი და პრევენციული შემოწმებები.', ...geo(16), locations: [loc(16, 'კაბინეტი 12', WEEKDAYS, '09:00', '14:00', 20), loc(20, 'კაბინეტი 4', [6], '10:00', '14:00', 20)] },
  { id: 10, fullName: 'ლევან ჩხაიძე', specialty: 'cardiology', rating: 4.7, experienceYears: 16, active: true, reviewCount: 0, education: 'თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, კარდიოლოგია', languages: ['ქართული', 'რუსული', 'ინგლისური'], bio: 'არტერიული წნევის, გულის რითმის დარღვევებისა და გულის უკმარისობის მართვა.', ...geo(14), locations: [loc(14, 'კაბინეტი 21', [2, 4], '09:00', '13:00'), loc(15, 'კაბინეტი 8', [1, 3], '14:00', '19:00')] },
  { id: 11, fullName: 'მაია გოგოლაძე', specialty: 'pediatrics', rating: 4.8, experienceYears: 13, active: true, reviewCount: 0, education: 'ბათუმის სახელმწიფო უნივერსიტეტი, პედიატრია', languages: ['ქართული', 'ინგლისური', 'თურქული'], bio: 'ბავშვთა გასინჯვა, ვაქცინაციის გრაფიკი და ზრდა-განვითარების კონტროლი.', ...geo(18), locations: [loc(18, 'კაბინეტი 6', WEEKDAYS, '10:00', '15:00')] },
  { id: 12, fullName: 'გიგა მესხი', specialty: 'neurology', rating: 4.5, experienceYears: 8, active: true, reviewCount: 0, education: 'ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი, ნევროლოგია', languages: ['ქართული', 'ინგლისური'], bio: 'თავის ტკივილის, ძილისა და ნერვული სისტემის დარღვევების კონსულტაცია.', ...geo(19), locations: [loc(19, 'კაბინეტი 17', [1, 3, 5], '12:00', '18:00', 45), loc(17, 'კაბინეტი 11', [2, 4], '12:00', '17:00', 45)] },
]

/* ---------- visit types and prices (GEL) ---------- */

const BASE_PRICE: Record<SpecialtyKey, number> = { therapy: 50, cardiology: 90, pediatrics: 60, dermatology: 70, neurology: 80, orthopedics: 80, ophthalmology: 60 }
const NETWORK_FACTOR: Record<string, number> = { ევექსი: 1.15, ავერსი: 1.05, მედიქალი: 0.95, 'ჯანმრთელობის ცენტრი': 0.85 }
/** price level of a clinic: depends on its network, a little lower in Batumi */
export const priceFactor = (clinic: Clinic) => (NETWORK_FACTOR[clinic.network] ?? 1) * (clinic.city === 'ბათუმი' ? 0.9 : 1)
const EXTRA_SERVICE: Record<SpecialtyKey, string> = {
  therapy: 'ანალიზების შეფასება',
  cardiology: 'ეკგ',
  pediatrics: 'ვაქცინაცია',
  dermatology: 'დერმატოსკოპია',
  neurology: 'ნევროლოგიური გამოკვლევა',
  orthopedics: 'სახსრის გამოკვლევა',
  ophthalmology: 'მხედველობის შემოწმება',
}
const round5 = (n: number) => Math.round(n / 5) * 5

/** the three default visit types of one doctor at one clinic */
export function defaultServices(specialty: SpecialtyKey, doctorId: number, clinicId: number, durationMin: number, firstId: number, factor = 1): DoctorService[] {
  const base = BASE_PRICE[specialty] * factor
  return [
    { id: firstId, doctorId, clinicId, name: 'პირველადი კონსულტაცია', price: round5(base), durationMin },
    { id: firstId + 1, doctorId, clinicId, name: 'განმეორებითი ვიზიტი', price: round5(base * 0.7), durationMin },
    { id: firstId + 2, doctorId, clinicId, name: EXTRA_SERVICE[specialty], price: round5(base * 0.6), durationMin },
  ]
}

function buildServices(): DoctorService[] {
  const list: DoctorService[] = []
  let id = 1
  doctors.forEach((d) => {
    d.locations.forEach((l) => {
      const base = BASE_PRICE[d.specialty] * priceFactor(clinics.find((c) => c.id === l.clinicId)!)
      list.push({ id: id++, doctorId: d.id, clinicId: l.clinicId, name: 'პირველადი კონსულტაცია', price: round5(base), durationMin: l.slotMinutes })
      list.push({ id: id++, doctorId: d.id, clinicId: l.clinicId, name: 'განმეორებითი ვიზიტი', price: round5(base * 0.7), durationMin: l.slotMinutes })
      list.push({ id: id++, doctorId: d.id, clinicId: l.clinicId, name: EXTRA_SERVICE[d.specialty], price: round5(base * 0.6), durationMin: l.slotMinutes })
    })
  })
  return list
}

/* ---------- helpers for the generated history ---------- */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const slotTimes = (l: DoctorLocation) => {
  const out: string[] = []
  for (let t = toMin(l.start); t + l.slotMinutes <= toMin(l.end); t += l.slotMinutes) out.push(fromMin(t))
  return out
}
const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00`).getDay()

const REASONS: Record<SpecialtyKey, string[]> = {
  cardiology: ['წნევის კონტროლი', 'გულისცემის აჩქარება', 'ეკგ', 'გულმკერდის დისკომფორტი'],
  pediatrics: ['ბავშვის გასინჯვა', 'ვაქცინაცია', 'ცხელება'],
  dermatology: ['კანის გამონაყარი', 'ხალების შემოწმება', 'აკნე'],
  neurology: ['თავის ტკივილი', 'თავბრუსხვევა', 'ძილის პრობლემა'],
  orthopedics: ['მუხლის ტკივილი', 'ზურგის ტკივილი', 'ტრავმის შემდგომი კონსულტაცია'],
  ophthalmology: ['მხედველობის შემოწმება', 'თვალის წნევა'],
  therapy: ['გაციება', 'ზოგადი გასინჯვა', 'ანალიზების შედეგები'],
}
const DIAGNOSES = ['დიაგნოზი დადგენილია, მკურნალობა დანიშნულია', 'პათოლოგია არ დასტურდება', 'მდგომარეობა გაუმჯობესებულია, რეკომენდებულია დაკვირვება', 'საჭიროა დამატებითი გამოკვლევა']
const PRESCRIPTIONS = ['რეკომენდაციები მიცემულია', 'დანიშნულია მედიკამენტი 7 დღით', 'ანალიზები და განმეორებითი ვიზიტი 2 კვირაში', 'დატვირთვის რეჟიმი და დაკვირვება']

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
  const rng = mulberry32(20261028)
  const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)]
  const today = new Date()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dayOffset = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return iso(d)
  }
  const ago = (days: number) => new Date(today.getTime() - days * 864e5).toISOString()
  const doctorById = (id: number) => doctors.find((d) => d.id === id)!
  const locationOn = (doctorId: number, date: string) => {
    const d = doctorById(doctorId)
    return d.locations.find((l) => l.days.includes(weekdayOf(date))) ?? d.locations[0]
  }
  /** first date on or after today + minOffset on which the doctor works somewhere */
  const workday = (doctorId: number, minOffset: number) => {
    const d = doctorById(doctorId)
    for (let i = minOffset; i < minOffset + 21; i++) {
      const date = dayOffset(i)
      if (d.locations.some((l) => l.days.includes(weekdayOf(date)))) return date
    }
    return dayOffset(minOffset)
  }

  const services = buildServices()
  const serviceFor = (doctorId: number, clinicId: number, kind: 'first' | 'follow' | 'extra') =>
    services.filter((s) => s.doctorId === doctorId && s.clinicId === clinicId)[kind === 'first' ? 0 : kind === 'follow' ? 1 : 2]

  const appointments: Appointment[] = []
  const taken = new Set<string>()
  interface NewAppt {
    doctorId: number
    patientId: number
    date: string
    time?: string
    slot?: number
    reason?: string
    status: AppointmentStatus
    diagnosis?: string
    prescription?: string
    kind?: 'first' | 'follow' | 'extra'
    pay?: 'online' | 'cashier'
    createdDaysAgo?: number
  }
  const add = (a: NewAppt): Appointment | null => {
    const l = locationOn(a.doctorId, a.date)
    const time = a.time ?? slotTimes(l)[a.slot ?? 0]
    const key = `${a.doctorId}|${a.date}|${time}`
    if (a.status !== 'cancelled') {
      if (taken.has(key)) return null
      taken.add(key)
    }
    const sv = serviceFor(a.doctorId, l.clinicId, a.kind ?? 'first')
    const method = a.pay ?? (rng() < 0.6 ? 'online' : 'cashier')
    const paymentStatus: PaymentStatus = a.status === 'completed' ? 'paid' : a.status === 'cancelled' ? 'none' : method === 'online' ? 'pending' : 'at_clinic'
    const id = appointments.length + 1
    const appt: Appointment = {
      id,
      doctorId: a.doctorId,
      patientId: a.patientId,
      clinicId: l.clinicId,
      serviceId: sv.id,
      serviceName: sv.name,
      price: sv.price,
      paymentMethod: method,
      paymentStatus,
      date: a.date,
      time,
      reason: a.reason,
      status: a.status,
      diagnosis: a.diagnosis,
      prescription: a.prescription,
      createdAt: ago(a.createdDaysAgo ?? 7),
    }
    if (paymentStatus === 'paid') {
      appt.paidAt = new Date(`${a.date}T${time}:00`).toISOString()
      appt.receiptNo = `MB-${a.date.slice(0, 4)}-${String(id).padStart(6, '0')}`
      if (method === 'online') {
        appt.cardBrand = 'Visa'
        appt.cardLast4 = '4242'
      }
    }
    appointments.push(appt)
    return appt
  }

  // ----- the visits the demo story is built on (ids 1-9 stay the same) -----
  add({ doctorId: 1, patientId: 1, date: dayOffset(-14), time: '10:00', reason: 'წნევის პერიოდული მატება', status: 'completed', diagnosis: 'არტერიული ჰიპერტენზია, I ხარისხი', prescription: 'დღეში 1 ტაბლეტი ამლოდიპინი 5 მგ, წნევის დღიური', pay: 'online', createdDaysAgo: 20 })
  add({ doctorId: 2, patientId: 1, date: workday(2, 1), slot: 3, reason: 'ყოველწლიური გასინჯვა', status: 'confirmed', pay: 'online', createdDaysAgo: 0 })
  add({ doctorId: 4, patientId: 1, date: dayOffset(-5), time: '09:30', status: 'cancelled', createdDaysAgo: 9 })
  add({ doctorId: 1, patientId: 4, date: dayOffset(-30), time: '09:30', reason: 'გულისცემის აჩქარება', status: 'completed', diagnosis: 'სინუსური ტაქიკარდია, რეკომენდებულია ეკგ მონიტორინგი', prescription: 'კოფეინის შემცირება, 24-საათიანი ჰოლტერი', pay: 'cashier', createdDaysAgo: 35 })
  add({ doctorId: 1, patientId: 5, date: dayOffset(-21), time: '11:30', reason: 'გულმკერდის დისკომფორტი', status: 'completed', diagnosis: 'კუნთოვანი ტკივილი, გულის პათოლოგია არ დასტურდება', prescription: 'ფიზიკური დატვირთვის რეჟიმი, განმეორებითი ვიზიტი 1 თვეში', pay: 'online', createdDaysAgo: 25 })
  add({ doctorId: 1, patientId: 6, date: dayOffset(-9), time: '14:00', reason: 'სპორტული ექიმის ცნობა', status: 'completed', diagnosis: 'პრაქტიკულად ჯანმრთელი', prescription: 'ცნობა გაცემულია', pay: 'cashier', createdDaysAgo: 12 })
  add({ doctorId: 2, patientId: 4, date: dayOffset(-12), time: '10:30', reason: 'შვილის ვაქცინაცია', status: 'completed', kind: 'extra', diagnosis: 'ვაქცინაცია ჩატარებულია', prescription: 'დაკვირვება 48 საათის განმავლობაში', pay: 'online', createdDaysAgo: 15 })
  add({ doctorId: 3, patientId: 5, date: dayOffset(-16), time: '12:00', reason: 'თავის ტკივილი', status: 'completed', diagnosis: 'დაძაბულობის ტიპის თავის ტკივილი', prescription: 'ძილის რეჟიმი, მაგნიუმის შემცველი პრეპარატი', pay: 'cashier', createdDaysAgo: 20 })
  add({ doctorId: 1, patientId: 4, date: workday(1, 1), slot: 2, reason: 'განმეორებითი ვიზიტი', status: 'confirmed', kind: 'follow', pay: 'cashier', createdDaysAgo: 1 })

  // ----- today and the coming days: always on days the doctor really works, at real slots -----
  add({ doctorId: 1, patientId: 4, date: workday(1, 0), slot: 3, reason: 'განმეორებითი კონსულტაცია', status: 'confirmed', kind: 'follow', pay: 'online' })
  add({ doctorId: 1, patientId: 5, date: workday(1, 0), slot: 6, reason: 'ანალიზების შედეგები', status: 'confirmed', pay: 'cashier' })
  add({ doctorId: 1, patientId: 1, date: workday(1, 0), slot: 9, reason: 'წნევის კონტროლი', status: 'confirmed', kind: 'follow', pay: 'online' })
  add({ doctorId: 1, patientId: 6, date: workday(1, 2), slot: 1, reason: 'გულისცემა დატვირთვისას', status: 'confirmed', pay: 'online' })
  add({ doctorId: 2, patientId: 5, date: workday(2, 2), slot: 4, reason: 'ბავშვის გასინჯვა', status: 'confirmed', pay: 'cashier' })
  add({ doctorId: 3, patientId: 4, date: workday(3, 0), slot: 2, reason: 'თავბრუსხვევა', status: 'confirmed', pay: 'online' })

  const reviews: Review[] = [
    { id: 1, doctorId: 1, patientId: 1, appointmentId: 1, rating: 5, comment: 'ძალიან ყურადღებიანი ექიმია, ყველაფერი დეტალურად ამიხსნა და გეგმა დამიწერა.', createdAt: ago(13), doctorReply: 'გმადლობთ! გისურვებთ კარგ თვითგრძნობას.', doctorReplyAt: ago(12) },
    { id: 2, doctorId: 1, patientId: 4, appointmentId: 4, rating: 5, comment: 'სწრაფი დიაგნოსტიკა და გასაგები რეკომენდაციები.', createdAt: ago(29) },
    { id: 3, doctorId: 1, patientId: 5, appointmentId: 5, rating: 4, comment: 'კარგი სპეციალისტია, მხოლოდ რიგში ცოტა დავიცადე.', createdAt: ago(20) },
    { id: 4, doctorId: 1, patientId: 6, appointmentId: 6, rating: 5, createdAt: ago(8) },
    { id: 5, doctorId: 2, patientId: 4, appointmentId: 7, rating: 5, comment: 'ბავშვი ექიმთან არ შეშინებულა, ძალიან კეთილია.', createdAt: ago(11) },
    { id: 6, doctorId: 3, patientId: 5, appointmentId: 8, rating: 4, comment: 'დეტალური კონსულტაცია.', createdAt: ago(15) },
  ]

  // ----- a longer history, so filters and paging have something to work on -----
  const generate = (patientId: number, count: number) => {
    let made = 0
    let guard = 0
    while (made < count && guard++ < count * 20) {
      const d = pick(doctors)
      const date = dayOffset(-(2 + Math.floor(rng() * 700)))
      const completed = rng() < 0.84
      const kind = pick<'first' | 'follow' | 'extra'>(['first', 'first', 'follow', 'follow', 'extra'])
      const l = locationOn(d.id, date)
      const time = pick(slotTimes(l))
      const a = add({
        doctorId: d.id,
        patientId,
        date,
        time,
        kind,
        reason: pick(REASONS[d.specialty]),
        status: completed ? 'completed' : 'cancelled',
        diagnosis: completed ? pick(DIAGNOSES) : undefined,
        prescription: completed ? pick(PRESCRIPTIONS) : undefined,
        createdDaysAgo: -Number(date.slice(0, 0)) + 5,
      })
      if (a) made++
    }
  }
  generate(1, 38)
  generate(4, 14)
  generate(5, 12)
  generate(6, 6)

  const medical: Record<number, MedicalProfile> = {
    1: { bloodType: 'A+', heightCm: 168, weightKg: 62, allergies: ['პენიცილინი'], chronicConditions: ['არტერიული ჰიპერტენზია'], medications: ['ამლოდიპინი 5 მგ'], surgeries: [], familyHistory: 'დედის მხრიდან ჰიპერტენზია.', sharedWithDoctors: true, updatedAt: ago(14) },
  }

  const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  const maxLocation = Math.max(...doctors.flatMap((d) => d.locations.map((l) => l.id)))
  return {
    users: copy(users),
    clinics: copy(clinics),
    doctors: copy(doctors),
    services,
    appointments,
    reviews,
    medical,
    seq: { user: 9, appointment: appointments.length + 1, review: 7, service: services.length + 1, location: maxLocation + 1 },
  }
}
