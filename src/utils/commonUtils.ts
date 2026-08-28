import { ROOM_COLOR_PALETTE } from '../styles/commonStyle';

function hashRoomId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  return hash >>> 0;
}

export function getRoomColor(id: string): string {
  return ROOM_COLOR_PALETTE[hashRoomId(id) % ROOM_COLOR_PALETTE.length];
}
