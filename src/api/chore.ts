import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser, fetchDisplayName } from './auth';

const client = generateClient<Schema>();

export type ChoreRow = Schema['Chore']['type'];
export type ChoreLogRow = Schema['ChoreLog']['type'];
export type RecurrenceType = ChoreRow['recurrenceType'];
export type IntervalUnit = ChoreRow['intervalUnit'];

export interface ChoreInput {
  title: string;
  description?: string;
  recurrenceType: 'INTERVAL' | 'YEARLY_MONTHS';
  intervalValue?: number;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH';
  months?: number[];
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

export function computeNextDueDate(chore: ChoreInput, from: Date): string {
  if (chore.recurrenceType === 'INTERVAL') {
    const value = chore.intervalValue ?? 1;
    let next = new Date(from);
    switch (chore.intervalUnit) {
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

  const months = [...(chore.months ?? [])].sort((a, b) => a - b);
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

export function throwIfErrors(errors: unknown, fallbackMessage: string): void {
  if (errors && Array.isArray(errors) && errors.length > 0) {
    const message = (errors[0] as { message?: string })?.message;
    throw new Error(message ?? fallbackMessage);
  }
}

export async function listChoresForRoom(roomId: string): Promise<ChoreRow[]> {
  const { data: chores, errors } = await client.models.Chore.listChoreByRoomId({ roomId });
  throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
  return chores;
}

export async function listAllChoresForRoom(roomId: string): Promise<ChoreRow[]> {
  const results: ChoreRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Chore.listChoreByRoomId({ roomId }, { nextToken });
    throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
}

export async function createChore(roomId: string, input: ChoreInput): Promise<ChoreRow> {
  const { data: chore, errors } = await client.models.Chore.create({
    roomId,
    title: input.title,
    description: input.description,
    recurrenceType: input.recurrenceType,
    intervalValue: input.intervalValue,
    intervalUnit: input.intervalUnit,
    months: input.months,
    nextDueDate: toDateString(new Date()),
  });
  throwIfErrors(errors, '집안일 생성에 실패했습니다.');
  if (!chore) {
    throw new Error('집안일 생성에 실패했습니다.');
  }
  return chore;
}

export async function updateChore(
  choreId: string,
  input: ChoreInput,
  roomId?: string,
): Promise<void> {
  const { errors } = await client.models.Chore.update({
    id: choreId,
    roomId,
    title: input.title,
    description: input.description ?? null,
    recurrenceType: input.recurrenceType,
    intervalValue: input.intervalValue ?? null,
    intervalUnit: input.intervalUnit ?? null,
    months: input.months ?? null,
  });
  throwIfErrors(errors, '집안일 수정에 실패했습니다.');
}

async function deleteAllChoreLogsForChore(choreId: string): Promise<void> {
  let nextToken: string | null | undefined;
  do {
    const {
      data: logs,
      nextToken: token,
      errors,
    } = await client.models.ChoreLog.listChoreLogByChoreId({ choreId }, { nextToken });
    throwIfErrors(errors, '완료 기록 삭제에 실패했습니다.');
    const deleteResults = await Promise.all(
      logs.map(log => client.models.ChoreLog.delete({ id: log.id })),
    );
    deleteResults.forEach(result => throwIfErrors(result.errors, '완료 기록 삭제에 실패했습니다.'));
    nextToken = token;
  } while (nextToken);
}

export async function deleteChoreAndLogs(choreId: string): Promise<void> {
  await deleteAllChoreLogsForChore(choreId);
  const { errors } = await client.models.Chore.delete({ id: choreId });
  throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
}

export async function completeChore(chore: ChoreRow): Promise<void> {
  const user = await getCurrentAuthUser();
  const displayName = await fetchDisplayName();
  const now = new Date();

  const { errors: logErrors } = await client.models.ChoreLog.create({
    choreId: chore.id,
    completedBy: user.userId,
    completedByName: displayName,
    completedAt: now.toISOString(),
  });
  throwIfErrors(logErrors, '완료 처리에 실패했습니다.');

  const nextDueDate = computeNextDueDate(
    {
      title: chore.title,
      recurrenceType: chore.recurrenceType ?? 'INTERVAL',
      intervalValue: chore.intervalValue ?? undefined,
      intervalUnit: chore.intervalUnit ?? undefined,
      months: chore.months?.filter((m): m is number => m !== null) ?? undefined,
    },
    now,
  );

  const { errors: updateErrors } = await client.models.Chore.update({
    id: chore.id,
    nextDueDate,
  });
  throwIfErrors(updateErrors, '완료 처리에 실패했습니다.');
}

export async function listChoreLogs(choreId: string, limit = 5): Promise<ChoreLogRow[]> {
  // listChoreLogByChoreId has no sort key, so sortDirection isn't supported server-side —
  // fetch and sort client-side instead.
  const { data: logs, errors } = await client.models.ChoreLog.listChoreLogByChoreId({ choreId });
  throwIfErrors(errors, '완료 기록을 불러오지 못했습니다.');
  return [...logs].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, limit);
}
