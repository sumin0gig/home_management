import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser, fetchDisplayName } from '../api/auth';
import { throwIfErrors } from '../api/shared';
import { toDateString } from '../utils/date';
import { computeHappinessGain } from '../utils/happiness';
import { listRoomsForFamily } from './useRoomStore';
import { useMascotStore } from './useMascotStore';

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

async function listChoresForRoom(roomId: string): Promise<ChoreRow[]> {
  const { data: chores, errors } = await client.models.Chore.listChoreByRoomId({
    roomId,
  });
  throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
  return chores;
}

async function deleteAllChoreLogsForChore(choreId: string): Promise<void> {
  let nextToken: string | null | undefined;
  do {
    const {
      data: logs,
      nextToken: token,
      errors,
    } = await client.models.ChoreLog.listChoreLogByChoreId(
      { choreId },
      { nextToken },
    );
    throwIfErrors(errors, '완료 기록 삭제에 실패했습니다.');
    const deleteResults = await Promise.all(
      logs.map(log => client.models.ChoreLog.delete({ id: log.id })),
    );
    deleteResults.forEach(result =>
      throwIfErrors(result.errors, '완료 기록 삭제에 실패했습니다.'),
    );
    nextToken = token;
  } while (nextToken);
}

export async function listChoreLogs(
  choreId: string,
  limit = 5,
): Promise<ChoreLogRow[]> {
  // listChoreLogByChoreId has no sort key, so sortDirection isn't supported server-side —
  // fetch and sort client-side instead.
  const { data: logs, errors } =
    await client.models.ChoreLog.listChoreLogByChoreId({ choreId });
  throwIfErrors(errors, '완료 기록을 불러오지 못했습니다.');
  return [...logs]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);
}

type ChoreStatus = 'idle' | 'loading' | 'loaded';

interface ChoreState {
  status: ChoreStatus;
  chores: ChoreRow[];
  currentFamilyId: string | null;
  error: string | null;
  fetchChoresForFamily: (familyId: string) => Promise<void>;
  createChore: (roomId: string, input: ChoreInput) => Promise<void>;
  updateChore: (
    choreId: string,
    input: ChoreInput,
    roomId?: string,
  ) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  completeChore: (chore: ChoreRow) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'idle' as ChoreStatus,
  chores: [] as ChoreRow[],
  currentFamilyId: null as string | null,
  error: null as string | null,
};

export const useChoreStore = create<ChoreState>((set, get) => ({
  ...initialState,

  fetchChoresForFamily: async (familyId: string) => {
    set({ status: 'loading', error: null, currentFamilyId: familyId });
    try {
      const rooms = await listRoomsForFamily(familyId);
      const choresByRoom = await Promise.all(
        rooms.map(room => listChoresForRoom(room.id)),
      );
      set({ status: 'loaded', chores: choresByRoom.flat() });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  createChore: async (roomId: string, input: ChoreInput) => {
    set({ error: null });
    try {
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
      set({ chores: [...get().chores, chore] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateChore: async (choreId: string, input: ChoreInput, roomId?: string) => {
    set({ error: null });
    try {
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
      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchChoresForFamily(currentFamilyId);
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteChore: async (choreId: string) => {
    set({ error: null });
    try {
      await deleteAllChoreLogsForChore(choreId);
      const { errors } = await client.models.Chore.delete({ id: choreId });
      throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
      set({ chores: get().chores.filter(c => c.id !== choreId) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  completeChore: async (chore: ChoreRow) => {
    set({ error: null });
    try {
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
          months:
            chore.months?.filter((m): m is number => m !== null) ?? undefined,
        },
        now,
      );

      const { errors: updateErrors } = await client.models.Chore.update({
        id: chore.id,
        nextDueDate,
      });
      throwIfErrors(updateErrors, '완료 처리에 실패했습니다.');

      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchChoresForFamily(currentFamilyId);
      }
      await useMascotStore.getState().addHappiness(computeHappinessGain(chore));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
