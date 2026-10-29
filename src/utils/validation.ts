import { z } from 'zod'

/**
 * Validation schemas. They are used twice:
 *  1. in the forms (React Hook Form) for instant feedback,
 *  2. in the mock API, because a server must never trust the browser.
 */

const phoneRegex = /^\+995\d{9}$/
// rejects control characters (keeps normal text and new lines)
// eslint-disable-next-line no-control-regex
const noControlChars = /^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/

/** trimmed text with a length limit and no control characters */
const safeText = (max: number) =>
  z.string().trim().max(max, `მაქსიმუმ ${max} სიმბოლო`).regex(noControlChars, 'ტექსტი შეიცავს დაუშვებელ სიმბოლოებს')

const emailField = z.string().trim().min(1, 'შეიყვანეთ ელ-ფოსტა').email('ელ-ფოსტის ფორმატი არასწორია').max(120, 'ელ-ფოსტა ძალიან გრძელია')

const passwordRules = z
  .string()
  .min(8, 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს')
  .max(100, 'პაროლი ძალიან გრძელია')
  .regex(/\d/, 'პაროლში უნდა იყოს მინიმუმ ერთი ციფრი')
  .regex(/[^A-Za-z0-9]/, 'პაროლში უნდა იყოს მინიმუმ ერთი სპეციალური სიმბოლო')

const optionalPhone = z
  .string()
  .optional()
  .refine((v) => !v || phoneRegex.test(v), 'ფორმატი: +995 და 9 ციფრი, მაგ. +995555123456')

const optionalBirthDate = z
  .string()
  .optional()
  .refine((v) => {
    if (!v) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(`${v}T00:00:00`)
    return !Number.isNaN(d.getTime()) && d <= new Date() && d.getFullYear() >= 1900
  }, 'თარიღი არასწორია ან მომავალშია')

export const loginSchema = z.object({
  email: z.string().min(1, 'შეიყვანეთ ელ-ფოსტა').email('ელ-ფოსტის ფორმატი არასწორია'),
  password: z.string().min(1, 'შეიყვანეთ პაროლი'),
})
export type LoginForm = z.infer<typeof loginSchema>

/** fields sent to the server on registration */
export const registerFields = z.object({
  fullName: safeText(80).pipe(z.string().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')),
  email: emailField,
  phone: optionalPhone,
  password: passwordRules,
})

export const registerSchema = registerFields
  .extend({ confirmPassword: z.string().min(1, 'გაიმეორეთ პაროლი') })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'პაროლები არ ემთხვევა' })
export type RegisterForm = z.infer<typeof registerSchema>

export const bookingSchema = z.object({
  reason: safeText(300).optional(),
})
export type BookingForm = z.infer<typeof bookingSchema>

export const visitSchema = z.object({
  diagnosis: safeText(2000).pipe(z.string().min(3, 'ჩაწერეთ დიაგნოზი')),
  prescription: safeText(2000).pipe(z.string().min(3, 'ჩაწერეთ დანიშნულება')),
})
export type VisitForm = z.infer<typeof visitSchema>

/* ---------- profiles ---------- */

export const generalProfileSchema = z.object({
  fullName: safeText(80).pipe(z.string().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')),
  phone: optionalPhone,
  dateOfBirth: optionalBirthDate,
  city: safeText(60).optional(),
})
export type GeneralProfileForm = z.infer<typeof generalProfileSchema>

export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const

const listItem = safeText(80).pipe(z.string().min(1, 'ცარიელი ჩანაწერი დაუშვებელია'))

/** what the API accepts for the medical profile */
export const medicalSchema = z.object({
  bloodType: z.union([z.enum(BLOOD_TYPES), z.literal('')]),
  heightCm: z.number().min(30, 'სიმაღლე 30-250 სმ უნდა იყოს').max(250, 'სიმაღლე 30-250 სმ უნდა იყოს').optional(),
  weightKg: z.number().min(2, 'წონა 2-400 კგ უნდა იყოს').max(400, 'წონა 2-400 კგ უნდა იყოს').optional(),
  allergies: z.array(listItem).max(20, 'მაქსიმუმ 20 ჩანაწერი'),
  chronicConditions: z.array(listItem).max(20, 'მაქსიმუმ 20 ჩანაწერი'),
  medications: z.array(listItem).max(20, 'მაქსიმუმ 20 ჩანაწერი'),
  surgeries: z.array(listItem).max(20, 'მაქსიმუმ 20 ჩანაწერი'),
  familyHistory: safeText(1000),
  sharedWithDoctors: z.boolean(),
})
export type MedicalPayload = z.infer<typeof medicalSchema>

const numberText = (min: number, max: number, message: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+([.,]\d+)?$/.test(v) && Number(v.replace(',', '.')) >= min && Number(v.replace(',', '.')) <= max), message)

/** form version: numbers are typed as text and converted on submit */
export const medicalFormSchema = z.object({
  bloodType: z.union([z.enum(BLOOD_TYPES), z.literal('')]),
  heightCm: numberText(30, 250, 'სიმაღლე 30-250 სმ უნდა იყოს'),
  weightKg: numberText(2, 400, 'წონა 2-400 კგ უნდა იყოს'),
  familyHistory: safeText(1000),
  sharedWithDoctors: z.boolean(),
})
export type MedicalFormValues = z.infer<typeof medicalFormSchema>

export const doctorProfileSchema = z.object({
  bio: safeText(600).pipe(z.string().min(10, 'აღწერა უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს')),
  education: safeText(200).optional(),
  languages: z.array(safeText(30).pipe(z.string().min(2, 'ენის სახელი ძალიან მოკლეა'))).max(8, 'მაქსიმუმ 8 ენა'),
})
export type DoctorProfilePayload = z.infer<typeof doctorProfileSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'შეიყვანეთ მიმდინარე პაროლი'),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'გაიმეორეთ ახალი პაროლი'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'პაროლები არ ემთხვევა' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'ახალი პაროლი მიმდინარესგან განსხვავებული უნდა იყოს' })
export type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

/* ---------- reviews ---------- */

export const reviewSchema = z.object({
  appointmentId: z.number().int().positive(),
  rating: z.number().int('აირჩიეთ შეფასება').min(1, 'აირჩიეთ შეფასება').max(5, 'აირჩიეთ შეფასება'),
  comment: safeText(500).optional(),
})
export type ReviewPayload = z.infer<typeof reviewSchema>

export const replySchema = z.object({
  reply: safeText(500).pipe(z.string().min(2, 'პასუხი ძალიან მოკლეა')),
})
export type ReplyForm = z.infer<typeof replySchema>

/** server-side checks for booking input */
export const bookingPayloadSchema = z.object({
  doctorId: z.number().int().positive(),
  clinicId: z.number().int().positive('აირჩიეთ კლინიკა'),
  serviceId: z.number().int().positive().optional(),
  paymentMethod: z.enum(['online', 'cashier']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'თარიღის ფორმატი არასწორია'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'დროის ფორმატი არასწორია'),
  reason: safeText(300).optional(),
})

/* ---------- schedules, prices and payment ---------- */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'დროის ფორმატი არასწორია')

export const locationInputSchema = z
  .object({
    clinicId: z.number().int().positive('აირჩიეთ კლინიკა'),
    room: safeText(40).pipe(z.string().min(1, 'მიუთითეთ კაბინეტი')),
    days: z.array(z.number().int().min(0).max(6)).min(1, 'აირჩიეთ მინიმუმ ერთი დღე').max(7),
    start: hhmm,
    end: hhmm,
    slotMinutes: z.number().int().min(10, 'ვიზიტი მინიმუმ 10 წუთია').max(120, 'ვიზიტი მაქსიმუმ 120 წუთია'),
  })
  .refine((v) => v.start < v.end, { path: ['end'], message: 'დასასრული დასაწყისზე გვიან უნდა იყოს' })

export const locationsSchema = z.object({
  locations: z.array(locationInputSchema).min(1, 'მინიმუმ ერთი ლოკაცია საჭიროა').max(6, 'მაქსიმუმ 6 ლოკაცია'),
})
export type LocationsPayload = z.infer<typeof locationsSchema>

export const servicesSchema = z.object({
  services: z
    .array(
      z.object({
        clinicId: z.number().int().positive(),
        name: safeText(80).pipe(z.string().min(2, 'სახელი ძალიან მოკლეა')),
        price: z.number().min(0, 'ფასი უარყოფითი ვერ იქნება').max(2000, 'ფასი ძალიან მაღალია'),
        durationMin: z.number().int().min(5).max(180),
      }),
    )
    .min(1, 'მინიმუმ ერთი მომსახურებაა საჭირო')
    .max(30),
})
export type ServicesPayload = z.infer<typeof servicesSchema>

/** demo payment: card data is validated, never stored */
export const paymentSchema = z.object({
  method: z.enum(['card', 'apple_pay']),
  cardNumber: z.string().max(30).optional(),
  expiry: z.string().max(7).optional(),
  cvc: z.string().max(4).optional(),
  cardholder: safeText(60).optional(),
})
export type PaymentPayload = z.infer<typeof paymentSchema>
