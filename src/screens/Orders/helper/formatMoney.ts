export function formatMoney(value: number | undefined) {
  return `PHP ${(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}