import { create } from 'zustand';
import {
  listChoresForRoom,
  createChore as apiCreateChore,
  updateChore as apiUpdateChore,
  deleteChoreAndLogs as apiDeleteChoreAndLogs,
  completeChore as apiCompleteChore,
  type ChoreRow,
  type ChoreInput,
} from '../api/chore';
import { listRoomsForFamily } from '../api/room';
import { useMascotStore } from './useMascotStore';

type ChoreStatus = 'idle' | 'loading' | 'loaded';

interface ChoreState {
  status: ChoreStatus;
  chores: ChoreRow[];
  currentFamilyId: string | null;
  error: string | null;
  fetchChoresForFamily: (familyId: string) => Promise<void>;
  createChore: (roomId: string, input: ChoreInput) => Promise<void>;
  updateChore: (
    choreId: string,
    input: ChoreInput,
    roomId?: string,
  ) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  completeChore: (chore: ChoreRow) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'idle' as ChoreStatus,
  chores: [] as ChoreRow[],
  currentFamilyId: null as string | null,
  error: null as string | null,
};

export const useChoreStore = create<ChoreState>((set, get) => ({
  ...initialState,

  fetchChoresForFamily: async (familyId: string) => {
    set({ status: 'loading', error: null, currentFamilyId: familyId });
    try {
      const rooms = await listRoomsForFamily(familyId);
      const choresByRoom = await Promise.all(
        rooms.map(room => listChoresForRoom(room.id)),
      );
      set({ status: 'loaded', chores: choresByRoom.flat() });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  createChore: async (roomId: string, input: ChoreInput) => {
    set({ error: null });
    try {
      const chore = await apiCreateChore(roomId, input);
      set({ chores: [...get().chores, chore] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateChore: async (choreId: string, input: ChoreInput, roomId?: string) => {
    set({ error: null });
    try {
      await apiUpdateChore(choreId, input, roomId);
      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchChoresForFamily(currentFamilyId);
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteChore: async (choreId: string) => {
    set({ error: null });
    try {
      await apiDeleteChoreAndLogs(choreId);
      set({ chores: get().chores.filter(c => c.id !== choreId) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  completeChore: async (chore: ChoreRow) => {
    set({ error: null });
    try {
      await apiCompleteChore(chore);
      const { currentFamilyId } = get();
      if (currentFamilyId) {
        await get().fetchChoresForFamily(currentFamilyId);
      }
      await useMascotStore.getState().fetchMyMascot();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
