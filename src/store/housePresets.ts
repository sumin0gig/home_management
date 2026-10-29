import type { RoomType } from './useRoomStore';

export type HousePresetKey = 'one' | 'two' | 'three';

export interface HousePresetRoom {
  roomType: NonNullable<RoomType>;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HousePreset {
  label: string;
  description: string;
  rooms: HousePresetRoom[];
}

// 처음 집을 만들 때 고르는 집 모양. 모두 GRID_COLUMNS(10칸) 안에서 겹치지 않는다.
export const HOUSE_PRESETS: Record<HousePresetKey, HousePreset> = {
  one: {
    label: '원룸',
    description: '방 1 · 부엌 · 화장실',
    rooms: [
      { roomType: 'BEDROOM', x: 0, y: 0, width: 4, height: 3 },
      { roomType: 'KITCHEN', x: 4, y: 0, width: 2, height: 2 },
      { roomType: 'BATHROOM', x: 4, y: 2, width: 2, height: 1 },
      { roomType: 'ENTRANCE', x: 6, y: 0, width: 1, height: 1 },
    ],
  },
  two: {
    label: '투룸',
    description: '거실 · 방 2 · 부엌 · 화장실',
    rooms: [
      { roomType: 'LIVING_ROOM', x: 0, y: 0, width: 4, height: 3 },
      { roomType: 'BEDROOM', x: 4, y: 0, width: 3, height: 3 },
      { roomType: 'KITCHEN', x: 0, y: 3, width: 3, height: 2 },
      {
        roomType: 'GENERAL_ROOM',
        label: '작은방',
        x: 3,
        y: 3,
        width: 2,
        height: 2,
      },
      { roomType: 'BATHROOM', x: 7, y: 0, width: 2, height: 1 },
      { roomType: 'ENTRANCE', x: 9, y: 0, width: 1, height: 1 },
    ],
  },
  three: {
    label: '쓰리룸',
    description: '거실 · 방 3 · 부엌 · 화장실 2',
    rooms: [
      { roomType: 'LIVING_ROOM', x: 0, y: 0, width: 4, height: 3 },
      { roomType: 'KITCHEN', x: 4, y: 0, width: 3, height: 2 },
      { roomType: 'BEDROOM', x: 0, y: 3, width: 3, height: 3 },
      {
        roomType: 'GENERAL_ROOM',
        label: '작은방',
        x: 3,
        y: 3,
        width: 2,
        height: 2,
      },
      {
        roomType: 'GENERAL_ROOM',
        label: '작은방',
        x: 5,
        y: 3,
        width: 2,
        height: 2,
      },
      { roomType: 'BATHROOM', x: 7, y: 0, width: 2, height: 1 },
      { roomType: 'BATHROOM', x: 7, y: 1, width: 2, height: 1 },
      { roomType: 'ENTRANCE', x: 9, y: 0, width: 1, height: 1 },
    ],
  },
};

export const HOUSE_PRESET_KEYS: HousePresetKey[] = ['one', 'two', 'three'];
