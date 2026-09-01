import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser } from '../api/auth';
import { throwIfErrors } from '../api/shared';

const client = generateClient<Schema>();

export type MascotRow = Schema['Mascot']['type'];

export interface MascotInput {
  earStyle: 'ROUND' | 'POINTY' | 'FLOPPY';
  tailStyle: 'STRAIGHT' | 'CURLY';
  fillColor?: string;
  happiness?: number;
}

type MascotStatus = 'loading' | 'none' | 'created';

interface MascotState {
  status: MascotStatus;
  mascot: MascotRow | null;
  error: string | null;
  fetchMyMascot: () => Promise<void>;
  createMascot: (input: MascotInput) => Promise<void>;
  updateMascot: (input: Partial<MascotInput>) => Promise<void>;
  addHappiness: (gain: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'loading' as MascotStatus,
  mascot: null as MascotRow | null,
  error: null as string | null,
};

export const useMascotStore = create<MascotState>((set, get) => ({
  ...initialState,

  fetchMyMascot: async () => {
    set({ status: 'loading', error: null });
    try {
      const user = await getCurrentAuthUser();
      const { data: mascots, errors } = await client.models.Mascot.list({
        filter: { userId: { eq: user.userId } },
      });
      throwIfErrors(errors, '마스코트 정보를 불러오지 못했습니다.');
      const mascot = mascots[0] ?? null;
      set({ status: mascot ? 'created' : 'none', mascot });
    } catch (err) {
      set({ status: 'none', error: (err as Error).message });
    }
  },

  createMascot: async (input: MascotInput) => {
    set({ error: null });
    try {
      const user = await getCurrentAuthUser();
      const { data: mascot, errors } = await client.models.Mascot.create({
        userId: user.userId,
        ...input,
      });
      throwIfErrors(errors, '마스코트 생성에 실패했습니다.');
      if (!mascot) {
        throw new Error('마스코트 생성에 실패했습니다.');
      }
      set({ status: 'created', mascot });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateMascot: async (input: Partial<MascotInput>) => {
    set({ error: null });
    const { mascot } = get();
    if (!mascot) {
      return;
    }
    try {
      const { data: updated, errors } = await client.models.Mascot.update({
        id: mascot.id,
        ...input,
      });
      throwIfErrors(errors, '마스코트 수정에 실패했습니다.');
      if (!updated) {
        throw new Error('마스코트 수정에 실패했습니다.');
      }
      set({ mascot: updated });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  addHappiness: async (gain: number) => {
    try {
      const user = await getCurrentAuthUser();
      const { data: mascots, errors } = await client.models.Mascot.list({
        filter: { userId: { eq: user.userId } },
      });
      throwIfErrors(errors, '마스코트 정보를 불러오지 못했습니다.');
      const mascot = mascots[0];
      if (!mascot) {
        return;
      }
      const { data: updated, errors: updateErrors } =
        await client.models.Mascot.update({
          id: mascot.id,
          happiness: (mascot.happiness ?? 0) + gain,
        });
      throwIfErrors(updateErrors, '마스코트 수정에 실패했습니다.');
      if (updated) {
        set({ status: 'created', mascot: updated });
      }
    } catch {
      // 마스코트 행복도 갱신 실패가 집안일 완료 자체를 실패시키면 안 됨
    }
  },

  reset: () => set({ ...initialState }),
}));
