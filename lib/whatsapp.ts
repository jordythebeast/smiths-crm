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

export function statusMessage(
  customerFirstName: string,
  bike: { year?: number | null; make: string; model: string },
  status: string,
  jobType: string = 'service'
): string {
  const bikeName = `${bike.year ? bike.year + ' ' : ''}${bike.make} ${bike.model}`
  if (jobType === 'buy_sell') {
    return `Hi ${customerFirstName}, quick update on the ${bikeName} at Smith's Motorcycles. Give us a call if you have any questions. 🏍️`
  }
  switch (status) {
    case 'checked_in':
      return `Hi ${customerFirstName}, we've received your ${bikeName} at Smith's Motorcycles and we'll give you a call once we've assessed it. 🏍️`
    case 'in_progress':
      return `Hi ${customerFirstName}, just a quick update — we're currently working on your ${bikeName}. We'll be in touch as soon as it's ready. 🔧`
    case 'ready':
      return readyMessage(customerFirstName, bike)
    default:
      return `Hi ${customerFirstName}, quick update on your ${bikeName} at Smith's Motorcycles. Give us a call if you have any questions.`
  }
}
