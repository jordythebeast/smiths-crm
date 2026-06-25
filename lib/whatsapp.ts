export function whatsappUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  let number = cleaned
  if (number.startsWith('0')) number = '27' + number.slice(1)
  else if (number.startsWith('+')) number = number.slice(1)
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function readyMessage(customerFirstName: string, bike: { year?: number | null; make: string; model: string }): string {
  const bikeName = `${bike.year ? bike.year + ' ' : ''}${bike.make} ${bike.model}`
  return `Hi ${customerFirstName}, your ${bikeName} is ready for collection at Smith's Motorcycles! 🏍️ Please give us a call to arrange a convenient time.`
}
