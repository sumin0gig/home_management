import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { throwIfErrors, toDateString, listAllChoresForRoom, deleteChoreAndLogs } from './chore';
import { listChoreTemplatesForRoomType } from './choreTemplate';

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

export const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as Array<NonNullable<RoomType>>;

export function roomDisplayName(room: RoomRow): string {
  if (room.label && room.label.trim()) {
    return room.label;
  }
  return room.roomType ? ROOM_TYPE_LABELS[room.roomType] : '방';
}

export async function listRoomsForFamily(familyId: string): Promise<RoomRow[]> {
  const { data: rooms, errors } = await client.models.Room.listRoomByFamilyId({ familyId });
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
    } = await client.models.Room.listRoomByFamilyId({ familyId }, { nextToken });
    throwIfErrors(errors, '방 목록을 불러오지 못했습니다.');
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
}

export async function createRoom(
  familyId: string,
  roomType: NonNullable<RoomType>,
  label?: string,
): Promise<RoomRow> {
  const { data: room, errors } = await client.models.Room.create({
    familyId,
    roomType,
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
