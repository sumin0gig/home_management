import { getMonths, getWeekdays, type RecurrenceInput } from './date';

const BASE_LEVEL_CAP = 100;
const LEVEL_CAP_GROWTH = 1.2;

// Mirrors the day-count approximation computeNextDueDate (src/utils/date.ts)
// already uses for interval math: DAY=1, WEEK=7, MONTH=30 days.
// 매주 요일을 k개 지정하면 일주일에 k번 하므로 회당 7/k일 치를 준다.
// 날짜 지정(매달 15일 등)은 점수에 영향이 없다.
export function computeHappinessGain(task: RecurrenceInput): number {
  if (task.recurrenceType === 'YEARLY_MONTHS') {
    const monthCount = getMonths(task).length;
    return monthCount > 0 ? Math.round(365 / monthCount) : 30;
  }
  const value = task.intervalValue ?? 1;
  switch (task.intervalUnit) {
    case 'WEEK': {
      const weekdayCount = getWeekdays(task).length;
      return weekdayCount > 0 ? Math.round(7 / weekdayCount) : value * 7;
    }
    case 'MONTH':
      return value * 30;
    case 'DAY':
    default:
      return value * 1;
  }
}

export interface HappinessLevel {
  level: number;
  gaugeValue: number;
  gaugeMax: number;
}

// Level N's cap = BASE_LEVEL_CAP * 1.2^(N-1). Consume totalHappiness through
// successive level caps until what's left doesn't fill the next one.
export function computeHappinessLevel(totalHappiness: number): HappinessLevel {
  let remaining = Math.max(0, totalHappiness);
  let level = 1;
  let cap = BASE_LEVEL_CAP;
  while (remaining >= cap) {
    remaining -= cap;
    level += 1;
    cap = Math.round(cap * LEVEL_CAP_GROWTH);
  }
  return { level, gaugeValue: remaining, gaugeMax: cap };
}
