export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueLabel(nextDueDate: string, today: string): string {
  if (nextDueDate < today) {
    return '기한 지남';
  }
  if (nextDueDate === today) {
    return '오늘';
  }
  return `예정 (${nextDueDate})`;
}
