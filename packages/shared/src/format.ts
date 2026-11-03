export const formatBaht = (n: number) =>
  `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`
