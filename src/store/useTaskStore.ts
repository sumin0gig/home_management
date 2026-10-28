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
  computeFirstDueDate,
  computeNextDueDate,
  dueDateOnSave,
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
  // 화면을 스피너로 바꾸지 않는 새로고침이 도는 중인지 (당겨서 새로고침 표시용)
  isRefreshing: boolean;
  tasks: TaskRow[];
  currentFamilyId: string | null;
  error: string | null;
  fetchTasksForFamily: (familyId: string) => Promise<void>;
  refreshTasksForFamily: (familyId: string) => Promise<void>;
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

// 가족의 모든 방에 있는 집안일. fetch와 refresh가 같이 쓴다.
async function listTasksForFamily(familyId: string): Promise<TaskRow[]> {
  const rooms = await listRoomsForFamily(familyId);
  const tasksByRoom = await Promise.all(
    rooms.map(room => listTasksForRoom(room.id)),
  );
  return tasksByRoom.flat();
}

const initialState = {
  status: 'idle' as TaskStatus,
  isRefreshing: false,
  tasks: [] as TaskRow[],
  currentFamilyId: null as string | null,
  error: null as string | null,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  ...initialState,

  fetchTasksForFamily: async (familyId: string) => {
    set({ status: 'loading', error: null, currentFamilyId: familyId });
    try {
      const tasks = await listTasksForFamily(familyId);
      set({ status: 'loaded', tasks });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  // fetchTasksForFamily와 같은 데이터를 받지만 status를 'loading'으로 바꾸지 않는다.
  // HomeScreen은 'loading'이면 화면 전체를 스피너로 바꾸므로, 포커스·당겨서
  // 새로고침·완료 뒤에는 이걸 불러야 홈이 깜빡이지 않는다. 실패하면 지금 목록은
  // 그대로 두고 error만 채운다.
  refreshTasksForFamily: async (familyId: string) => {
    set({ isRefreshing: true, currentFamilyId: familyId });
    try {
      const tasks = await listTasksForFamily(familyId);
      set({ tasks, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isRefreshing: false });
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
        weekdays: input.weekdays,
        monthDay: input.monthDay,
        nextDueDate: computeFirstDueDate(input, new Date()),
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
      // 반복 설정을 바꿨을 때만 기한을 새 설정의 첫 차례로 다시 잡는다. 이름·방법만
      // 고친 수정은 기한을 건드리지 않는다 (지난 일의 반복을 바꾸면 "지남"이 풀린다).
      const existing = get().tasks.find(t => t.id === taskId);
      const nextDueDate = dueDateOnSave(existing, input, new Date());
      const { errors } = await client.models.Task.update({
        id: taskId,
        roomId,
        title: input.title,
        recurrenceType: input.recurrenceType,
        intervalValue: input.intervalValue ?? null,
        intervalUnit: input.intervalUnit ?? null,
        months: input.months ?? null,
        weekdays: input.weekdays ?? null,
        monthDay: input.monthDay ?? null,
        ...(nextDueDate ? { nextDueDate } : {}),
      });
      throwIfErrors(errors, '집안일 수정에 실패했습니다.');
      if (input.items) {
        await deleteAllTaskItemsForTask(taskId);
        await createTaskItems(taskId, input.items);
      }
      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().refreshTasksForFamily(currentFamilyId);
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

      const nextDueDate = computeNextDueDate(task, now, task.nextDueDate);

      const { errors: updateErrors } = await client.models.Task.update({
        id: task.id,
        nextDueDate,
      });
      throwIfErrors(updateErrors, '완료 처리에 실패했습니다.');

      // 축하·"오늘 마지막 할 일" 판단이 네트워크를 기다리지 않도록 스토어의 기한을
      // 바로 고친다. 다른 가족이 바꾼 것까지 맞추는 전체 새로고침은 뒤에서 돌린다
      // (refreshTasksForFamily는 실패해도 error만 채우고 reject하지 않는다).
      set({
        tasks: get().tasks.map(t =>
          t.id === task.id ? { ...t, nextDueDate } : t,
        ),
      });
      await useMascotStore.getState().addHappiness(computeHappinessGain(task));

      const { currentFamilyId } = get();
      if (currentFamilyId) {
        get().refreshTasksForFamily(currentFamilyId);
      }
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  reset: () => set({ ...initialState }),
}));
