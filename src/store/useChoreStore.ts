import { create } from 'zustand';
import {
  listChoresForFamily,
  createChore as apiCreateChore,
  updateChore as apiUpdateChore,
  deleteChore as apiDeleteChore,
  completeChore as apiCompleteChore,
  type ChoreRow,
  type ChoreInput,
} from '../api/chore';

type ChoreStatus = 'idle' | 'loading' | 'loaded';

interface ChoreState {
  status: ChoreStatus;
  chores: ChoreRow[];
  error: string | null;
  fetchChores: (familyId: string) => Promise<void>;
  createChore: (familyId: string, input: ChoreInput) => Promise<void>;
  updateChore: (choreId: string, input: ChoreInput) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  completeChore: (chore: ChoreRow) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'idle' as ChoreStatus,
  chores: [] as ChoreRow[],
  error: null as string | null,
};

export const useChoreStore = create<ChoreState>((set, get) => ({
  ...initialState,

  fetchChores: async (familyId: string) => {
    set({ status: 'loading', error: null });
    try {
      const chores = await listChoresForFamily(familyId);
      set({ status: 'loaded', chores });
    } catch (err) {
      set({ status: 'loaded', error: (err as Error).message });
    }
  },

  createChore: async (familyId: string, input: ChoreInput) => {
    set({ error: null });
    try {
      const chore = await apiCreateChore(familyId, input);
      set({ chores: [...get().chores, chore] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateChore: async (choreId: string, input: ChoreInput) => {
    set({ error: null });
    try {
      await apiUpdateChore(choreId, input);
      const familyId = get().chores.find(c => c.id === choreId)?.familyId;
      if (familyId) {
        await get().fetchChores(familyId);
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteChore: async (choreId: string) => {
    set({ error: null });
    try {
      await apiDeleteChore(choreId);
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
      await get().fetchChores(chore.familyId);
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
