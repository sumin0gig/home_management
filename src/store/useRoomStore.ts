import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { throwIfErrors } from '../api/shared';
import { toDateString } from '../utils/date';

const client = generateClient<Schema>();

export type RoomRow = Schema['Room']['type'];
export type RoomType = RoomRow['roomType'];
export type RoomSize = RoomRow['size'];

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

export const ROOM_SIZE_LABELS: Record<NonNullable<RoomSize>, string> = {
  VERY_SMALL: '매우 작음',
  SMALL: '작음',
  NORMAL: '보통',
  BIG: '큼',
  VERY_BIG: '매우 큼',
};

export const ROOM_SIZES = Object.keys(ROOM_SIZE_LABELS) as Array<
  NonNullable<RoomSize>
>;

export const DEFAULT_ROOM_SIZE: NonNullable<RoomSize> = 'NORMAL';

export const ROOM_TYPE_DEFAULT_SIZE: Record<
  NonNullable<RoomType>,
  NonNullable<RoomSize>
> = {
  LIVING_ROOM: 'VERY_BIG',
  BATHROOM: 'SMALL',
  KITCHEN: 'BIG',
  ENTRANCE: 'VERY_SMALL',
  BEDROOM: 'BIG',
  GENERAL_ROOM: 'NORMAL',
};

// 도면도 그리드에서 타일 너비 비율(%)로 쓰는 값. 합이 딱 100/50 등으로 안 떨어져도
// flexWrap이 알아서 다음 줄로 넘겨주므로 상대적 크기감만 표현하면 된다.
export const ROOM_SIZE_WIDTH_RATIO: Record<NonNullable<RoomSize>, number> = {
  VERY_SMALL: 28,
  SMALL: 40,
  NORMAL: 48,
  BIG: 64,
  VERY_BIG: 100,
};

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

// 방을 삭제할 때 그 안의 집안일/완료 기록도 함께 지워야 한다. useChoreStore를 가져다 쓰면
// useChoreStore -> useRoomStore(listRoomsForFamily) 방향과 순환 참조가 생기므로,
// 여기서는 필요한 Amplify 호출을 직접 반복한다(useChoreStore.deleteChore와 로직이 겹침).
async function listAllChoreIdsForRoom(roomId: string): Promise<string[]> {
  const results: string[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Chore.listChoreByRoomId({ roomId }, { nextToken });
    throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
    results.push(...data.map(chore => chore.id));
    nextToken = token;
  } while (nextToken);
  return results;
}

async function deleteChoreAndLogs(choreId: string): Promise<void> {
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

  const { errors } = await client.models.Chore.delete({ id: choreId });
  throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
}

async function listChoreTemplatesForRoomType(
  roomType: NonNullable<RoomType>,
): Promise<Schema['ChoreTemplate']['type'][]> {
  const { data: templates, errors } =
    await client.models.ChoreTemplate.listChoreTemplateByRoomType({
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
    size?: NonNullable<RoomSize>,
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
    size: NonNullable<RoomSize> = DEFAULT_ROOM_SIZE,
    label?: string,
  ) => {
    set({ error: null });
    try {
      const { data: room, errors } = await client.models.Room.create({
        familyId,
        roomType,
        size,
        label,
      });
      throwIfErrors(errors, '방 생성에 실패했습니다.');
      if (!room) {
        throw new Error('방 생성에 실패했습니다.');
      }

      const templates = await listChoreTemplatesForRoomType(roomType);
      const today = toDateString(new Date());
      await Promise.all(
        templates.map(async template => {
          const { errors: choreErrors } = await client.models.Chore.create({
            roomId: room.id,
            title: template.title,
            description: template.description,
            recurrenceType: template.recurrenceType,
            intervalValue: template.intervalValue,
            intervalUnit: template.intervalUnit,
            months: template.months,
            nextDueDate: today,
          });
          throwIfErrors(choreErrors, '집안일 시딩에 실패했습니다.');
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
      const choreIds = await listAllChoreIdsForRoom(roomId);
      await Promise.all(choreIds.map(choreId => deleteChoreAndLogs(choreId)));
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
