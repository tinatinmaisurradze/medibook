import { z } from 'zod'

const phoneRegex = /^\+995\d{9}$/

export const loginSchema = z.object({
  email: z.string().min(1, 'შეიყვანეთ ელ-ფოსტა').email('ელ-ფოსტის ფორმატი არასწორია'),
  password: z.string().min(1, 'შეიყვანეთ პაროლი'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს'),
    email: z.string().min(1, 'შეიყვანეთ ელ-ფოსტა').email('ელ-ფოსტის ფორმატი არასწორია'),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || phoneRegex.test(v), 'ფორმატი: +995 და 9 ციფრი, მაგ. +995555123456'),
    password: z
      .string()
      .min(8, 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს')
      .regex(/\d/, 'პაროლში უნდა იყოს მინიმუმ ერთი ციფრი')
      .regex(/[^A-Za-z0-9]/, 'პაროლში უნდა იყოს მინიმუმ ერთი სპეციალური სიმბოლო'),
    confirmPassword: z.string().min(1, 'გაიმეორეთ პაროლი'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'პაროლები არ ემთხვევა' })
export type RegisterForm = z.infer<typeof registerSchema>

export const bookingSchema = z.object({
  reason: z.string().max(300, 'ტექსტი ძალიან გრძელია (მაქს. 300 სიმბოლო)').optional(),
})
export type BookingForm = z.infer<typeof bookingSchema>

export const visitSchema = z.object({
  diagnosis: z.string().trim().min(3, 'ჩაწერეთ დიაგნოზი'),
  prescription: z.string().trim().min(3, 'ჩაწერეთ დანიშნულება'),
})
export type VisitForm = z.infer<typeof visitSchema>
