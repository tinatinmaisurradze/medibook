/** Monday first, the way people read a week. Values are JavaScript day numbers (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const DAY_SHORT: Record<number, string> = { 0: 'კვი', 1: 'ორშ', 2: 'სამ', 3: 'ოთხ', 4: 'ხუთ', 5: 'პარ', 6: 'შაბ' }
export const DAY_LONG: Record<number, string> = { 0: 'კვირა', 1: 'ორშაბათი', 2: 'სამშაბათი', 3: 'ოთხშაბათი', 4: 'ხუთშაბათი', 5: 'პარასკევი', 6: 'შაბათი' }

/** [1,3,5] -> "ორშ, ოთხ, პარ" */
export const daysLabel = (days: number[]) => WEEK_ORDER.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(', ')
