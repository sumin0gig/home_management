import { create } from 'zustand';
import {
  listRoomsForFamily,
  createRoom as apiCreateRoom,
  deleteRoom as apiDeleteRoom,
  type RoomRow,
  type RoomType,
} from '../api/room';

type RoomStatus = 'idle' | 'loading' | 'loaded';

interface RoomState {
  status: RoomStatus;
  rooms: RoomRow[];
  error: string | null;
  fetchRooms: (familyId: string) => Promise<void>;
  addRoom: (familyId: string, roomType: NonNullable<RoomType>, label?: string) => Promise<void>;
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

  addRoom: async (familyId: string, roomType: NonNullable<RoomType>, label?: string) => {
    set({ error: null });
    try {
      const room = await apiCreateRoom(familyId, roomType, label);
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
