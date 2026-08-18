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

interface DefaultChoreSeed extends ChoreInput {}

export const DEFAULT_CHORES: DefaultChoreSeed[] = [
  {
    title: '햇빛살균',
    description: '침구, 신발, 장난감, 위생도구를 햇빛살균',
    recurrenceType: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'WEEK',
  },
  {
    title: '먼지털이 청소',
    description: '장식장, 상단, 선반, 냉장고 위 등 먼지가 쌓이는 곳 청소',
    recurrenceType: 'INTERVAL',
    intervalValue: 2,
    intervalUnit: 'WEEK',
  },
  {
    title: '거울 닦기',
    description: '화장실, 현관 거울 닦기',
    recurrenceType: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'WEEK',
  },
  {
    title: '배수구 청소',
    description: '싱크대, 화장실 배수구 청소',
    recurrenceType: 'INTERVAL',
    intervalValue: 2,
    intervalUnit: 'WEEK',
  },
  {
    title: '냉장고 정리',
    description: '유통기한 지난 음식 정리, 내부 청소',
    recurrenceType: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'MONTH',
  },
  {
    title: '변기/욕실 곰팡이 제거',
    description: '변기, 타일 줄눈, 실리콘 부분 곰팡이 제거',
    recurrenceType: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'MONTH',
  },
  {
    title: '에어컨 필터 청소',
    description: '냉방 시즌 전 에어컨 필터 점검 및 청소',
    recurrenceType: 'YEARLY_MONTHS',
    months: [6],
  },
  {
    title: '보일러 점검',
    description: '난방 시즌 전 보일러 상태 점검',
    recurrenceType: 'YEARLY_MONTHS',
    months: [10],
  },
  {
    title: '옷장 계절 정리',
    description: '환절기 옷 정리 및 계절 옷 교체',
    recurrenceType: 'YEARLY_MONTHS',
    months: [3, 9],
  },
];

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeNextDueDate(chore: ChoreInput, from: Date): string {
  if (chore.recurrenceType === 'INTERVAL') {
    const value = chore.intervalValue ?? 1;
    const next = new Date(from);
    switch (chore.intervalUnit) {
      case 'DAY':
        next.setDate(next.getDate() + value);
        break;
      case 'WEEK':
        next.setDate(next.getDate() + value * 7);
        break;
      case 'MONTH':
      default:
        next.setMonth(next.getMonth() + value);
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

function throwIfErrors(errors: unknown, fallbackMessage: string): void {
  if (errors && Array.isArray(errors) && errors.length > 0) {
    const message = (errors[0] as { message?: string })?.message;
    throw new Error(message ?? fallbackMessage);
  }
}

export async function seedDefaultChores(familyId: string): Promise<void> {
  const today = toDateString(new Date());
  for (const seed of DEFAULT_CHORES) {
    const { errors } = await client.models.Chore.create({
      familyId,
      title: seed.title,
      description: seed.description,
      recurrenceType: seed.recurrenceType,
      intervalValue: seed.intervalValue,
      intervalUnit: seed.intervalUnit,
      months: seed.months,
      nextDueDate: today,
    });
    throwIfErrors(errors, '기본 집안일 생성에 실패했습니다.');
  }
}

export async function listChoresForFamily(familyId: string): Promise<ChoreRow[]> {
  const { data: chores, errors } = await client.models.Chore.listChoreByFamilyId({ familyId });
  throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
  return chores;
}

export async function createChore(familyId: string, input: ChoreInput): Promise<ChoreRow> {
  const { data: chore, errors } = await client.models.Chore.create({
    familyId,
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

export async function updateChore(choreId: string, input: ChoreInput): Promise<void> {
  const { errors } = await client.models.Chore.update({
    id: choreId,
    title: input.title,
    description: input.description ?? null,
    recurrenceType: input.recurrenceType,
    intervalValue: input.intervalValue ?? null,
    intervalUnit: input.intervalUnit ?? null,
    months: input.months ?? null,
  });
  throwIfErrors(errors, '집안일 수정에 실패했습니다.');
}

export async function deleteChore(choreId: string): Promise<void> {
  const { errors } = await client.models.Chore.delete({ id: choreId });
  throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
}

async function listAllChoresForFamily(familyId: string): Promise<ChoreRow[]> {
  const results: ChoreRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Chore.listChoreByFamilyId({ familyId }, { nextToken });
    throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
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
    await Promise.all(logs.map(log => client.models.ChoreLog.delete({ id: log.id })));
    nextToken = token;
  } while (nextToken);
}

export async function deleteAllChoresForFamily(familyId: string): Promise<void> {
  const chores = await listAllChoresForFamily(familyId);
  await Promise.all(
    chores.map(async chore => {
      await deleteAllChoreLogsForChore(chore.id);
      await client.models.Chore.delete({ id: chore.id });
    }),
  );
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
  const { data: logs, errors } = await client.models.ChoreLog.listChoreLogByChoreId(
    { choreId },
    { sortDirection: 'DESC', limit },
  );
  throwIfErrors(errors, '완료 기록을 불러오지 못했습니다.');
  return logs;
}
