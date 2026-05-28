export function formatDate(value?: string | Date) {
  if (!value) return 'Not available';

  return new Date(value).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}