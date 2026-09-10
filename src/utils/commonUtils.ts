import { ROOM_COLOR_PALETTE } from '../styles/commonStyle';

export function randomRoomColor(): string {
  const index = Math.floor(Math.random() * ROOM_COLOR_PALETTE.length);
  return ROOM_COLOR_PALETTE[index];
}
