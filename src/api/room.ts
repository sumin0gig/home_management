import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  toDateString,
  listAllChoresForRoom,
  deleteChoreAndLogs,
} from './chore';
import { throwIfErrors } from './shared';
import { listChoreTemplatesForRoomType } from './choreTemplate';

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

export async function createRoom(
  familyId: string,
  roomType: NonNullable<RoomType>,
  size: NonNullable<RoomSize> = DEFAULT_ROOM_SIZE,
  label?: string,
): Promise<RoomRow> {
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

  return room;
}

export async function deleteRoom(roomId: string): Promise<void> {
  const chores = await listAllChoresForRoom(roomId);
  await Promise.all(chores.map(chore => deleteChoreAndLogs(chore.id)));
  const { errors } = await client.models.Room.delete({ id: roomId });
  throwIfErrors(errors, '방 삭제에 실패했습니다.');
}

export async function deleteAllRoomsForFamily(familyId: string): Promise<void> {
  const rooms = await listAllRoomsForFamily(familyId);
  await Promise.all(rooms.map(room => deleteRoom(room.id)));
}
