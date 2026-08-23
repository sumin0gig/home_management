import { create } from 'zustand';
import {
  listRoomsForFamily,
  createRoom as apiCreateRoom,
  deleteRoom as apiDeleteRoom,
  DEFAULT_ROOM_SIZE,
  type RoomRow,
  type RoomType,
  type RoomSize,
} from '../api/room';

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
      const room = await apiCreateRoom(familyId, roomType, size, label);
      set({ rooms: [...get().rooms, room] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeRoom: async (roomId: string) => {
    set({ error: null });
    try {
      await apiDeleteRoom(roomId);
      set({ rooms: get().rooms.filter(r => r.id !== roomId) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
