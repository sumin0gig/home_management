import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  throwIfErrors,
  getCurrentAuthUser,
  fetchDisplayName,
  listRoomsForFamily,
  listTasksForRoom,
  createTaskItems,
  deleteAllTaskItemsForTask,
  deleteTaskWithChildren,
} from '../../actions';
import {
  toDateString,
  computeNextDueDate,
  type TaskInput,
  type TaskItemInput,
} from '../utils/date';
import { computeHappinessGain } from '../utils/happiness';
import { useMascotStore } from './useMascotStore';

const client = generateClient<Schema>();

export type TaskRow = Schema['Task']['type'];
export type TaskLogRow = Schema['TaskLog']['type'];
export type TaskItemRow = Schema['TaskItem']['type'];
export type RecurrenceType = TaskRow['recurrenceType'];
export type IntervalUnit = TaskRow['intervalUnit'];

export type { TaskInput, TaskItemInput };
export { computeNextDueDate };

type TaskStatus = 'idle' | 'loading' | 'loaded';

interface TaskState {
  status: TaskStatus;
  tasks: TaskRow[];
  currentFamilyId: string | null;
  error: string | null;
  fetchTasksForFamily: (familyId: string) => Promise<void>;
  createTask: (roomId: string, input: TaskInput) => Promise<boolean>;
  updateTask: (
    taskId: string,
    input: TaskInput,
    roomId?: string,
  ) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  completeTask: (task: TaskRow) => Promise<boolean>;
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
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
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
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  deleteTask: async (taskId: string) => {
    set({ error: null });
    try {
      await deleteTaskWithChildren(taskId);
      set({ tasks: get().tasks.filter(t => t.id !== taskId) });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  completeTask: async (task: TaskRow) => {
    set({ error: null });
    try {
      const [user, displayName] = await Promise.all([
        getCurrentAuthUser(),
        fetchDisplayName(),
      ]);
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
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  reset: () => set({ ...initialState }),
}));
