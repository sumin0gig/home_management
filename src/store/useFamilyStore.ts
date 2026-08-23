import { create } from 'zustand';
import {
  createFamily as apiCreateFamily,
  joinFamilyByInviteCode as apiJoinFamily,
  getMyFamily,
  listFamilyMembers,
  renameFamily as apiRenameFamily,
  removeFamilyMember as apiRemoveFamilyMember,
  leaveFamily as apiLeaveFamily,
  type FamilyRow,
  type FamilyMemberRow,
} from '../api/family';
import { fetchDisplayName } from '../api/auth';
import { useRoomStore } from './useRoomStore';

type FamilyStatus = 'loading' | 'none' | 'joined';

interface FamilyState {
  status: FamilyStatus;
  family: FamilyRow | null;
  membership: FamilyMemberRow | null;
  members: FamilyMemberRow[];
  error: string | null;
  fetchMyFamily: () => Promise<void>;
  createFamily: (name: string) => Promise<FamilyRow>;
  joinFamily: (inviteCode: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  renameFamily: (name: string) => Promise<void>;
  removeMember: (memberRecordId: string) => Promise<void>;
  leaveFamily: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: 'loading' as FamilyStatus,
  family: null as FamilyRow | null,
  membership: null as FamilyMemberRow | null,
  members: [] as FamilyMemberRow[],
  error: null as string | null,
};

export const useFamilyStore = create<FamilyState>((set, get) => ({
  ...initialState,

  fetchMyFamily: async () => {
    set({ status: 'loading', error: null });
    try {
      const result = await getMyFamily();
      if (!result) {
        set({ status: 'none', family: null, membership: null, members: [] });
        return;
      }
      const members = await listFamilyMembers(result.family.id);
      set({
        status: 'joined',
        family: result.family,
        membership: result.membership,
        members,
      });
    } catch (err) {
      set({ status: 'none', error: (err as Error).message });
    }
  },

  createFamily: async (name: string) => {
    set({ error: null });
    try {
      const displayName = await fetchDisplayName();
      const family = await apiCreateFamily(name, displayName);
      await get().fetchMyFamily();
      return family;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  joinFamily: async (inviteCode: string) => {
    set({ error: null });
    try {
      const displayName = await fetchDisplayName();
      await apiJoinFamily(inviteCode, displayName);
      await get().fetchMyFamily();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  refreshMembers: async () => {
    const { family } = get();
    if (!family) {
      return;
    }
    try {
      const members = await listFamilyMembers(family.id);
      set({ members });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  renameFamily: async (name: string) => {
    const { family } = get();
    if (!family) {
      return;
    }
    set({ error: null });
    try {
      await apiRenameFamily(family.id, name);
      set({ family: { ...family, name } });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeMember: async (memberRecordId: string) => {
    set({ error: null });
    try {
      await apiRemoveFamilyMember(memberRecordId);
      await get().refreshMembers();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  leaveFamily: async () => {
    const { membership, members } = get();
    if (!membership) {
      return;
    }
    set({ error: null });
    try {
      const otherMembersCount = members.filter(m => m.id !== membership.id).length;
      await apiLeaveFamily(membership, otherMembersCount);
      useRoomStore.getState().reset();
      set({ status: 'none', family: null, membership: null, members: [] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
