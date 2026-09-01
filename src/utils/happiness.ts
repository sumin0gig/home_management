import type { ChoreRow } from '../store/useChoreStore';

const BASE_LEVEL_CAP = 100;
const LEVEL_CAP_GROWTH = 1.2;

// Mirrors the day-count approximation computeNextDueDate (src/store/useChoreStore.ts)
// already uses for interval math: DAY=1, WEEK=7, MONTH=30 days.
export function computeHappinessGain(chore: ChoreRow): number {
  if (chore.recurrenceType === 'YEARLY_MONTHS') {
    const monthCount =
      chore.months?.filter((m): m is number => m !== null).length ?? 0;
    return monthCount > 0 ? Math.round(365 / monthCount) : 30;
  }
  const value = chore.intervalValue ?? 1;
  switch (chore.intervalUnit) {
    case 'WEEK':
      return value * 7;
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
