export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueLabel(
  nextDueDate: string,
  today: string,
): string | null {
  if (nextDueDate > today) {
    const diffDays = Math.round(
      (new Date(nextDueDate).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `D-${diffDays}`;
  }
  return null;
}

export interface TaskInput {
  title: string;
  recurrenceType: 'INTERVAL' | 'YEARLY_MONTHS';
  intervalValue?: number;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH';
  months?: number[];
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

export function computeNextDueDate(task: TaskInput, from: Date): string {
  if (task.recurrenceType === 'INTERVAL') {
    const value = task.intervalValue ?? 1;
    let next = new Date(from);
    switch (task.intervalUnit) {
      case 'DAY':
        next.setDate(next.getDate() + value);
        break;
      case 'WEEK':
        next.setDate(next.getDate() + value * 7);
        break;
      case 'MONTH':
      default:
        next = addMonthsClamped(next, value);
        break;
    }
    return toDateString(next);
  }

  const months = [...(task.months ?? [])].sort((a, b) => a - b);
  if (months.length === 0) {
    return toDateString(from);
  }
  const fromMonth = from.getMonth() + 1;
  const fromYear = from.getFullYear();
  const nextMonthInSameYear = months.find(m => m > fromMonth);
  if (nextMonthInSameYear) {
    return toDateString(new Date(fromYear, nextMonthInSameYear - 1, 1));
  }
  return toDateString(new Date(fromYear + 1, months[0] - 1, 1));
}
