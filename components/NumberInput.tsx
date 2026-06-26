'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (raw: string) => void
  placeholder?: string
  className?: string
  isDecimal?: boolean
}

export default function NumberInput({ value, onChange, placeholder, className, isDecimal = false }: Props) {
  const [focused, setFocused] = useState(false)

  const formatted = (() => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return isDecimal
      ? num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(num).toLocaleString('en-ZA')
  })()

  return (
    <input
      type="text"
      inputMode={isDecimal ? 'decimal' : 'numeric'}
      className={className}
      value={focused ? value : formatted}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(isDecimal ? /[^0-9.]/g : /[^0-9]/g, ''))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
