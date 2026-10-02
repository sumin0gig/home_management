import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  throwIfErrors,
  getCurrentAuthUser,
  fetchDisplayName,
} from '../../actions';
import { useRoomStore } from './useRoomStore';

const client = generateClient<Schema>();

export type FamilyRow = Schema['Family']['type'];
export type FamilyMemberRow = Schema['FamilyMember']['type'];

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type FamilyStatus = 'loading' | 'none' | 'joined';

interface FamilyState {
  status: FamilyStatus;
  family: FamilyRow | null;
  membership: FamilyMemberRow | null;
  members: FamilyMemberRow[];
  error: string | null;
  fetchMyFamily: () => Promise<void>;
  createFamily: (name: string) => Promise<boolean>;
  joinFamily: (inviteCode: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
  renameFamily: (name: string) => Promise<boolean>;
  removeMember: (memberRecordId: string) => Promise<boolean>;
  leaveFamily: () => Promise<boolean>;
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
      const user = await getCurrentAuthUser();
      const { data: memberships, errors } =
        await client.models.FamilyMember.list({
          filter: { userId: { eq: user.userId } },
        });
      throwIfErrors(errors, '가족 정보를 불러오지 못했습니다.');

      const membership = memberships[0];
      if (!membership) {
        set({ status: 'none', family: null, membership: null, members: [] });
        return;
      }

      const { data: family, errors: familyErrors } =
        await client.models.Family.get({ id: membership.familyId });
      throwIfErrors(familyErrors, '가족 정보를 불러오지 못했습니다.');
      if (!family) {
        set({ status: 'none', family: null, membership: null, members: [] });
        return;
      }

      const { data: members, errors: membersErrors } =
        await client.models.FamilyMember.list({
          filter: { familyId: { eq: family.id } },
        });
      throwIfErrors(membersErrors, '멤버 목록을 불러오지 못했습니다.');

      set({ status: 'joined', family, membership, members });
    } catch (err) {
      set({ status: 'none', error: (err as Error).message });
    }
  },

  createFamily: async (name: string) => {
    set({ error: null });
    try {
      const [displayName, user] = await Promise.all([
        fetchDisplayName(),
        getCurrentAuthUser(),
      ]);
      const { data: family, errors } = await client.models.Family.create({
        name,
        inviteCode: generateInviteCode(),
        ownerId: user.userId,
      });
      throwIfErrors(errors, '가족 생성에 실패했습니다.');
      if (!family) {
        throw new Error('가족 생성에 실패했습니다.');
      }

      const { errors: memberErrors } = await client.models.FamilyMember.create({
        familyId: family.id,
        userId: user.userId,
        familyOwnerId: [user.userId],
        displayName,
        role: 'OWNER',
      });
      throwIfErrors(memberErrors, '가족 생성에 실패했습니다.');

      await get().fetchMyFamily();
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  joinFamily: async (inviteCode: string) => {
    set({ error: null });
    try {
      const [displayName, user] = await Promise.all([
        fetchDisplayName(),
        getCurrentAuthUser(),
      ]);
      const normalizedCode = inviteCode.trim().toUpperCase();

      const { data: families, errors } =
        await client.models.Family.listFamilyByInviteCode({
          inviteCode: normalizedCode,
        });
      throwIfErrors(errors, '초대 코드를 확인하는 중 오류가 발생했습니다.');

      const family = families[0];
      if (!family) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }

      const { errors: memberErrors } = await client.models.FamilyMember.create({
        familyId: family.id,
        userId: user.userId,
        familyOwnerId: [family.ownerId],
        displayName,
        role: 'MEMBER',
      });
      throwIfErrors(memberErrors, '가족 참여에 실패했습니다.');

      await get().fetchMyFamily();
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  refreshMembers: async () => {
    const { family } = get();
    if (!family) {
      return;
    }
    try {
      const { data: members, errors } = await client.models.FamilyMember.list({
        filter: { familyId: { eq: family.id } },
      });
      throwIfErrors(errors, '멤버 목록을 불러오지 못했습니다.');
      set({ members });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  renameFamily: async (name: string) => {
    const { family } = get();
    if (!family) {
      return false;
    }
    set({ error: null });
    try {
      const { errors } = await client.models.Family.update({
        id: family.id,
        name,
      });
      throwIfErrors(errors, '가족 이름 변경에 실패했습니다.');
      set({ family: { ...family, name } });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  removeMember: async (memberRecordId: string) => {
    set({ error: null });
    try {
      const { errors } = await client.models.FamilyMember.delete({
        id: memberRecordId,
      });
      throwIfErrors(errors, '멤버 제거에 실패했습니다.');
      await get().refreshMembers();
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  leaveFamily: async () => {
    const { membership, members } = get();
    if (!membership) {
      return false;
    }
    set({ error: null });
    try {
      const otherMembersCount = members.filter(
        m => m.id !== membership.id,
      ).length;
      if (membership.role === 'OWNER' && otherMembersCount > 0) {
        throw new Error(
          '다른 구성원이 있는 동안에는 소유자가 가족을 떠날 수 없습니다.',
        );
      }

      if (membership.role === 'OWNER') {
        const { clearRoomsForFamily } = useRoomStore.getState();
        const cleared = await clearRoomsForFamily(membership.familyId);
        if (!cleared) {
          throw new Error('방 정리에 실패했습니다.');
        }
      }

      const { errors } = await client.models.FamilyMember.delete({
        id: membership.id,
      });
      throwIfErrors(errors, '가족을 떠나지 못했습니다.');

      if (membership.role === 'OWNER') {
        const { errors: deleteFamilyErrors } =
          await client.models.Family.delete({ id: membership.familyId });
        throwIfErrors(deleteFamilyErrors, '가족 삭제에 실패했습니다.');
      }

      useRoomStore.getState().reset();
      set({ status: 'none', family: null, membership: null, members: [] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  reset: () => set({ ...initialState }),
}));
