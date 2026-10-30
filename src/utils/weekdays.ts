import { tr } from '@/i18n'
/** Monday first, the way people read a week. Values are JavaScript day numbers (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const DAY_SHORT: Record<number, string> = { 0: tr("კვი"), 1: tr("ორშ"), 2: tr("სამ"), 3: tr("ოთხ"), 4: tr("ხუთ"), 5: tr("პარ"), 6: tr("შაბ") }
export const DAY_LONG: Record<number, string> = { 0: tr("კვირა"), 1: tr("ორშაბათი"), 2: tr("სამშაბათი"), 3: tr("ოთხშაბათი"), 4: tr("ხუთშაბათი"), 5: tr("პარასკევი"), 6: tr("შაბათი") }

/** [1,3,5] -> "ორშ, ოთხ, პარ" */
export const daysLabel = (days: number[]) => WEEK_ORDER.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(', ')
