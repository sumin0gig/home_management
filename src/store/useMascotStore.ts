import { create } from 'zustand';
import {
  getMyMascot,
  createMascot as apiCreateMascot,
  type MascotRow,
  type MascotInput,
} from '../api/mascot';

type MascotStatus = 'loading' | 'none' | 'created';

interface MascotState {
  status: MascotStatus;
  mascot: MascotRow | null;
  error: string | null;
  fetchMyMascot: () => Promise<void>;
  createMascot: (input: MascotInput) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'loading' as MascotStatus,
  mascot: null as MascotRow | null,
  error: null as string | null,
};

export const useMascotStore = create<MascotState>(set => ({
  ...initialState,

  fetchMyMascot: async () => {
    set({ status: 'loading', error: null });
    try {
      const mascot = await getMyMascot();
      set({ status: mascot ? 'created' : 'none', mascot });
    } catch (err) {
      set({ status: 'none', error: (err as Error).message });
    }
  },

  createMascot: async (input: MascotInput) => {
    set({ error: null });
    try {
      const mascot = await apiCreateMascot(input);
      set({ status: 'created', mascot });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
