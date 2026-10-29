/** Card helpers shared by the checkout form and the (mock) server. Demo only: no real payment is ever made. */

export const digitsOnly = (s: string) => s.replace(/\D/g, '')

/** Luhn checksum: catches mistyped card numbers */
export function luhn(number: string): boolean {
  const digits = digitsOnly(number)
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export function cardBrand(number: string): 'Visa' | 'Mastercard' | 'Amex' | 'Card' {
  const n = digitsOnly(number)
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  return 'Card'
}

/** "4242424242424242" -> "4242 4242 4242 4242" */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

/** "1228" -> "12/28" */
export function formatExpiry(value: string): string {
  const d = digitsOnly(value).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

/** true when the expiry is "MM/YY", a real month and not in the past */
export function isValidExpiry(expiry: string, now = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  // a card is valid until the end of its last month
  return new Date(year, month, 1) > now
}

export const isValidCvc = (cvc: string) => /^\d{3,4}$/.test(cvc)

/** Test cards that behave in a fixed way. Any other valid test number succeeds. */
export const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficient: '4000000000009995',
} as const

/** Price in GEL, for example "70 ₾" */
export const formatPrice = (n: number) => (n > 0 ? `${new Intl.NumberFormat('ka-GE').format(n)} ₾` : 'უფასო')
