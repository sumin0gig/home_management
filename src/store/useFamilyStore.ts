import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  throwIfErrors,
  getCurrentAuthUser,
  fetchDisplayName,
  listMyFamilyMemberships,
  listRoomsForFamily,
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

export const ALREADY_IN_FAMILY_MESSAGE =
  '이미 가족에 속해 있어요. 다른 가족에 참여하려면 먼저 지금 가족을 떠나주세요.';

// 구성원 기록이 여러 개면(예전 버그로 가족이 두 개가 된 사용자) 매번 같은 가족을
// 보여주도록 가장 먼저 만든 기록을 고른다.
export function pickPrimaryMembership(
  memberships: FamilyMemberRow[],
): FamilyMemberRow | null {
  if (memberships.length === 0) {
    return null;
  }
  return [...memberships].sort((a, b) =>
    (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
  )[0];
}

// 초대 코드로 찾은 가족 (참여 확인 화면에 보여줄 정보)
export interface FamilyLookup {
  family: FamilyRow;
  ownerName: string | null;
  memberCount: number;
  roomCount: number;
}

// 대문자로 바꾸고 영문·숫자만 남긴다 (초대 코드 입력·QR 공용)
export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
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
  // 코드에 맞는 가족이 없으면 null (오류일 때도 null이고 error에 남긴다)
  lookupFamilyByCode: (code: string) => Promise<FamilyLookup | null>;
  joinFamily: (familyId: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
  renameFamily: (name: string) => Promise<boolean>;
  // 가족에게 보이는 내 이름 (내 FamilyMember.displayName). 남은 완료 기록은 그대로.
  updateMyDisplayName: (name: string) => Promise<boolean>;
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
      const memberships = await listMyFamilyMemberships(user.userId);

      const membership = pickPrimaryMembership(memberships);
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

  lookupFamilyByCode: async (code: string) => {
    set({ error: null });
    try {
      const { data: families, errors } =
        await client.models.Family.listFamilyByInviteCode({
          inviteCode: normalizeInviteCode(code),
        });
      throwIfErrors(errors, '초대 코드를 확인하는 중 오류가 발생했습니다.');
      const family = families[0];
      if (!family) {
        return null;
      }
      const [{ data: members, errors: memberErrors }, rooms] =
        await Promise.all([
          client.models.FamilyMember.list({
            filter: { familyId: { eq: family.id } },
          }),
          listRoomsForFamily(family.id),
        ]);
      throwIfErrors(memberErrors, '가족 정보를 불러오지 못했습니다.');
      const owner = members.find(m => m.role === 'OWNER');
      return {
        family,
        ownerName: owner?.displayName ?? null,
        memberCount: members.length,
        roomCount: rooms.length,
      };
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  joinFamily: async (familyId: string) => {
    set({ error: null });
    try {
      const [displayName, user] = await Promise.all([
        fetchDisplayName(),
        getCurrentAuthUser(),
      ]);

      // 이미 가족이 있으면 아무것도 만들지 않는다 (구성원 기록이 두 개가 되면
      // 어느 가족이 보일지 알 수 없게 된다).
      const memberships = await listMyFamilyMemberships(user.userId);
      if (memberships.length > 0) {
        throw new Error(ALREADY_IN_FAMILY_MESSAGE);
      }

      const { data: family, errors } = await client.models.Family.get({
        id: familyId,
      });
      throwIfErrors(errors, '가족을 찾지 못했습니다.');
      if (!family) {
        throw new Error('가족을 찾지 못했습니다. 코드를 다시 확인해주세요.');
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

  updateMyDisplayName: async (name: string) => {
    const { membership } = get();
    if (!membership) {
      return false;
    }
    set({ error: null });
    try {
      const { data: updated, errors } = await client.models.FamilyMember.update(
        { id: membership.id, displayName: name },
      );
      throwIfErrors(errors, '이름을 바꾸지 못했습니다.');
      const next = updated ?? { ...membership, displayName: name };
      set({
        membership: next,
        members: get().members.map(m => (m.id === next.id ? next : m)),
      });
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
