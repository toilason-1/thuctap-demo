import { formatRelative } from 'date-fns/formatRelative'
import { enUS } from 'date-fns/locale/en-US'

/**
 * Converts a decimal number to a bijective base-26 string.
 *
 * Converts a positive integer to an Excel-style column name.
 *
 * 1 -> A
 * 2 -> B
 * ...
 * 26 -> Z
 * 27 -> AA
 */
export function toBb26(n: number): string {
  let name = ''
  while (n > 0) {
    const remainder = (n - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    n = Math.floor((n - 1) / 26)
  }
  return name || 'A'
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function timeRelative(dateStr: string): string {
  return formatRelative(new Date(dateStr), new Date(), { locale: enUS })
}
