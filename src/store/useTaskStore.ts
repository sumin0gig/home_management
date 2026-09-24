import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser, fetchDisplayName } from '../api/auth';
import { throwIfErrors } from '../api/shared';
import {
  toDateString,
  computeNextDueDate,
  type TaskInput,
  type TaskItemInput,
} from '../utils/date';
import { computeHappinessGain } from '../utils/happiness';
import { listRoomsForFamily } from './useRoomStore';
import { useMascotStore } from './useMascotStore';

const client = generateClient<Schema>();

export type TaskRow = Schema['Task']['type'];
export type TaskLogRow = Schema['TaskLog']['type'];
export type TaskItemRow = Schema['TaskItem']['type'];
export type RecurrenceType = TaskRow['recurrenceType'];
export type IntervalUnit = TaskRow['intervalUnit'];

export type { TaskInput, TaskItemInput };
export { computeNextDueDate };

async function listTasksForRoom(roomId: string): Promise<TaskRow[]> {
  const { data: tasks, errors } = await client.models.Task.listTaskByRoomId({
    roomId,
  });
  throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
  return tasks;
}

async function deleteAllTaskLogsForTask(taskId: string): Promise<void> {
  let nextToken: string | null | undefined;
  do {
    const {
      data: logs,
      nextToken: token,
      errors,
    } = await client.models.TaskLog.listTaskLogByTaskId(
      { taskId },
      { nextToken },
    );
    throwIfErrors(errors, '완료 기록 삭제에 실패했습니다.');
    const deleteResults = await Promise.all(
      logs.map(log => client.models.TaskLog.delete({ id: log.id })),
    );
    deleteResults.forEach(result =>
      throwIfErrors(result.errors, '완료 기록 삭제에 실패했습니다.'),
    );
    nextToken = token;
  } while (nextToken);
}

export async function listTaskLogs(
  taskId: string,
  limit = 5,
): Promise<TaskLogRow[]> {
  // listTaskLogByTaskId has no sort key, so sortDirection isn't supported server-side —
  // fetch and sort client-side instead.
  const { data: logs, errors } =
    await client.models.TaskLog.listTaskLogByTaskId({ taskId });
  throwIfErrors(errors, '완료 기록을 불러오지 못했습니다.');
  return [...logs]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);
}

export async function listTaskItems(taskId: string): Promise<TaskItemRow[]> {
  // listTaskItemByTaskId has no sort key, so sortDirection isn't supported
  // server-side — fetch and sort client-side by ord instead.
  const { data: items, errors } =
    await client.models.TaskItem.listTaskItemByTaskId({ taskId });
  throwIfErrors(errors, '집안일 안내 항목을 불러오지 못했습니다.');
  return [...items].sort((a, b) => a.ord - b.ord);
}

async function deleteAllTaskItemsForTask(taskId: string): Promise<void> {
  const items = await listTaskItems(taskId);
  const deleteResults = await Promise.all(
    items.map(item => client.models.TaskItem.delete({ id: item.id })),
  );
  deleteResults.forEach(result =>
    throwIfErrors(result.errors, '집안일 안내 항목 삭제에 실패했습니다.'),
  );
}

// 안내 항목은 입력 순서(방법 → TIP)대로 ord를 매겨 저장한다.
async function createTaskItems(
  taskId: string,
  items: TaskItemInput[],
): Promise<void> {
  const results = await Promise.all(
    items.map((item, index) =>
      client.models.TaskItem.create({
        taskId,
        type: item.type,
        content: item.content,
        ord: index,
      }),
    ),
  );
  results.forEach(result =>
    throwIfErrors(result.errors, '집안일 안내 항목 저장에 실패했습니다.'),
  );
}

type TaskStatus = 'idle' | 'loading' | 'loaded';

interface TaskState {
  status: TaskStatus;
  tasks: TaskRow[];
  currentFamilyId: string | null;
  error: string | null;
  fetchTasksForFamily: (familyId: string) => Promise<void>;
  createTask: (roomId: string, input: TaskInput) => Promise<void>;
  updateTask: (
    taskId: string,
    input: TaskInput,
    roomId?: string,
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (task: TaskRow) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'idle' as TaskStatus,
  tasks: [] as TaskRow[],
  currentFamilyId: null as string | null,
  error: null as string | null,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  ...initialState,

  fetchTasksForFamily: async (familyId: string) => {
    set({ status: 'loading', error: null, currentFamilyId: familyId });
    try {
      const rooms = await listRoomsForFamily(familyId);
      const tasksByRoom = await Promise.all(
        rooms.map(room => listTasksForRoom(room.id)),
      );
      set({ status: 'loaded', tasks: tasksByRoom.flat() });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  createTask: async (roomId: string, input: TaskInput) => {
    set({ error: null });
    try {
      const { data: task, errors } = await client.models.Task.create({
        roomId,
        title: input.title,
        recurrenceType: input.recurrenceType,
        intervalValue: input.intervalValue,
        intervalUnit: input.intervalUnit,
        months: input.months,
        nextDueDate: toDateString(new Date()),
      });
      throwIfErrors(errors, '집안일 생성에 실패했습니다.');
      if (!task) {
        throw new Error('집안일 생성에 실패했습니다.');
      }
      if (input.items && input.items.length > 0) {
        await createTaskItems(task.id, input.items);
      }
      set({ tasks: [...get().tasks, task] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateTask: async (taskId: string, input: TaskInput, roomId?: string) => {
    set({ error: null });
    try {
      const { errors } = await client.models.Task.update({
        id: taskId,
        roomId,
        title: input.title,
        recurrenceType: input.recurrenceType,
        intervalValue: input.intervalValue ?? null,
        intervalUnit: input.intervalUnit ?? null,
        months: input.months ?? null,
      });
      throwIfErrors(errors, '집안일 수정에 실패했습니다.');
      if (input.items) {
        await deleteAllTaskItemsForTask(taskId);
        await createTaskItems(taskId, input.items);
      }
      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchTasksForFamily(currentFamilyId);
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteTask: async (taskId: string) => {
    set({ error: null });
    try {
      await deleteAllTaskLogsForTask(taskId);
      await deleteAllTaskItemsForTask(taskId);
      const { errors } = await client.models.Task.delete({ id: taskId });
      throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
      set({ tasks: get().tasks.filter(t => t.id !== taskId) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  completeTask: async (task: TaskRow) => {
    set({ error: null });
    try {
      const user = await getCurrentAuthUser();
      const displayName = await fetchDisplayName();
      const now = new Date();

      const { errors: logErrors } = await client.models.TaskLog.create({
        taskId: task.id,
        completedBy: user.userId,
        completedByName: displayName,
        completedAt: now.toISOString(),
      });
      throwIfErrors(logErrors, '완료 처리에 실패했습니다.');

      const nextDueDate = computeNextDueDate(
        {
          title: task.title,
          recurrenceType: task.recurrenceType ?? 'INTERVAL',
          intervalValue: task.intervalValue ?? undefined,
          intervalUnit: task.intervalUnit ?? undefined,
          months:
            task.months?.filter((m): m is number => m !== null) ?? undefined,
        },
        now,
      );

      const { errors: updateErrors } = await client.models.Task.update({
        id: task.id,
        nextDueDate,
      });
      throwIfErrors(updateErrors, '완료 처리에 실패했습니다.');

      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchTasksForFamily(currentFamilyId);
      }
      await useMascotStore.getState().addHappiness(computeHappinessGain(task));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
