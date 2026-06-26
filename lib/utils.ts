const ALLCAPS = new Set(['BMW', 'KTM', 'MV', 'BSA', 'AJS', 'TVS', 'TM', 'MZ', 'GAS'])

export function normaliseName(str: string): string {
  return str.trim().split(/\s+/).filter(Boolean).map((word) => {
    if (ALLCAPS.has(word.toUpperCase())) return word.toUpperCase()
    if (word.includes('-')) {
      return word.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-')
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}
