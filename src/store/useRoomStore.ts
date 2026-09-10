import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { throwIfErrors } from '../api/shared';
import { toDateString } from '../utils/date';

const client = generateClient<Schema>();

export type RoomRow = Schema['Room']['type'];
export type RoomType = RoomRow['roomType'];

export const ROOM_TYPE_LABELS: Record<NonNullable<RoomType>, string> = {
  LIVING_ROOM: '거실',
  BATHROOM: '화장실',
  KITCHEN: '부엌',
  ENTRANCE: '현관',
  BEDROOM: '침실',
  GENERAL_ROOM: '방',
};

export const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as Array<
  NonNullable<RoomType>
>;

// 평면도 편집 UI(드래그 배치/리사이즈)가 나오기 전까지, 방 생성 시 임시로 쓰는
// 룸타입별 기본 그리드 크기. 실제 배치는 findNextRoomPlacement가 정한다.
export const ROOM_TYPE_DEFAULT_DIMENSIONS: Record<
  NonNullable<RoomType>,
  { width: number; height: number }
> = {
  ENTRANCE: { width: 2, height: 2 },
  BATHROOM: { width: 3, height: 2 },
  GENERAL_ROOM: { width: 3, height: 3 },
  KITCHEN: { width: 4, height: 3 },
  BEDROOM: { width: 4, height: 3 },
  LIVING_ROOM: { width: 5, height: 4 },
};

export interface RoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isRoomOverlapping(a: RoomRect, b: RoomRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

const GRID_COLUMNS = 10;

function findNextRoomPlacement(
  existing: RoomRect[],
  width: number,
  height: number,
): { x: number; y: number } {
  for (let y = 0; ; y++) {
    for (let x = 0; x <= GRID_COLUMNS - width; x++) {
      const candidate = { x, y, width, height };
      if (!existing.some(room => isRoomOverlapping(candidate, room))) {
        return { x, y };
      }
    }
  }
}

export function roomDisplayName(room: RoomRow): string {
  if (room.label && room.label.trim()) {
    return room.label;
  }
  return room.roomType ? ROOM_TYPE_LABELS[room.roomType] : '방';
}

export async function listRoomsForFamily(familyId: string): Promise<RoomRow[]> {
  const { data: rooms, errors } = await client.models.Room.listRoomByFamilyId({
    familyId,
  });
  throwIfErrors(errors, '방 목록을 불러오지 못했습니다.');
  return rooms;
}

async function listAllRoomsForFamily(familyId: string): Promise<RoomRow[]> {
  const results: RoomRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Room.listRoomByFamilyId(
      { familyId },
      { nextToken },
    );
    throwIfErrors(errors, '방 목록을 불러오지 못했습니다.');
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
}

// 방을 삭제할 때 그 안의 집안일/완료 기록도 함께 지워야 한다. useTaskStore를 가져다 쓰면
// useTaskStore -> useRoomStore(listRoomsForFamily) 방향과 순환 참조가 생기므로,
// 여기서는 필요한 Amplify 호출을 직접 반복한다(useTaskStore.deleteTask와 로직이 겹침).
async function listAllTaskIdsForRoom(roomId: string): Promise<string[]> {
  const results: string[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Task.listTaskByRoomId({ roomId }, { nextToken });
    throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
    results.push(...data.map(task => task.id));
    nextToken = token;
  } while (nextToken);
  return results;
}

async function deleteTaskAndLogs(taskId: string): Promise<void> {
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

  const { errors } = await client.models.Task.delete({ id: taskId });
  throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
}

async function listTaskTemplatesForRoomType(
  roomType: NonNullable<RoomType>,
): Promise<Schema['TaskTemplate']['type'][]> {
  const { data: templates, errors } =
    await client.models.TaskTemplate.listTaskTemplateByRoomType({
      roomType,
    });
  throwIfErrors(errors, '집안일 템플릿을 불러오지 못했습니다.');
  return templates;
}

type RoomStatus = 'idle' | 'loading' | 'loaded';

interface RoomState {
  status: RoomStatus;
  rooms: RoomRow[];
  error: string | null;
  fetchRooms: (familyId: string) => Promise<void>;
  addRoom: (
    familyId: string,
    roomType: NonNullable<RoomType>,
    label?: string,
  ) => Promise<void>;
  removeRoom: (roomId: string) => Promise<void>;
  clearRoomsForFamily: (familyId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'idle' as RoomStatus,
  rooms: [] as RoomRow[],
  error: null as string | null,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,

  fetchRooms: async (familyId: string) => {
    set({ status: 'loading', error: null });
    try {
      const rooms = await listRoomsForFamily(familyId);
      set({ status: 'loaded', rooms });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  addRoom: async (
    familyId: string,
    roomType: NonNullable<RoomType>,
    label?: string,
  ) => {
    set({ error: null });
    try {
      const { width, height } = ROOM_TYPE_DEFAULT_DIMENSIONS[roomType];
      const { x, y } = findNextRoomPlacement(get().rooms, width, height);
      const { data: room, errors } = await client.models.Room.create({
        familyId,
        roomType,
        label,
        x,
        y,
        width,
        height,
      });
      throwIfErrors(errors, '방 생성에 실패했습니다.');
      if (!room) {
        throw new Error('방 생성에 실패했습니다.');
      }

      const templates = await listTaskTemplatesForRoomType(roomType);
      const today = toDateString(new Date());
      await Promise.all(
        templates.map(async template => {
          const { errors: taskErrors } = await client.models.Task.create({
            roomId: room.id,
            title: template.title,
            description: template.description,
            recurrenceType: template.recurrenceType,
            intervalValue: template.intervalValue,
            intervalUnit: template.intervalUnit,
            months: template.months,
            nextDueDate: today,
          });
          throwIfErrors(taskErrors, '집안일 시딩에 실패했습니다.');
        }),
      );

      set({ rooms: [...get().rooms, room] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeRoom: async (roomId: string) => {
    set({ error: null });
    try {
      const taskIds = await listAllTaskIdsForRoom(roomId);
      await Promise.all(taskIds.map(taskId => deleteTaskAndLogs(taskId)));
      const { errors } = await client.models.Room.delete({ id: roomId });
      throwIfErrors(errors, '방 삭제에 실패했습니다.');
      set({ rooms: get().rooms.filter(r => r.id !== roomId) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  clearRoomsForFamily: async (familyId: string) => {
    const rooms = await listAllRoomsForFamily(familyId);
    await Promise.all(rooms.map(room => get().removeRoom(room.id)));
  },

  reset: () => set({ ...initialState }),
}));
