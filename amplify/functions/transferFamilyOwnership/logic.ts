// 관리자 넘기기의 실제 동작. 데이터 접근은 deps로 받아서 핸들러 밖에서도
// (단위 테스트에서) 그대로 돌릴 수 있게 한다.

export interface FamilyLike {
  id: string;
  ownerId: string;
  // Amplify가 allow.owner()로 만든 소유자 필드. identityClaim('sub')이라 값은 sub.
  owner?: string | null;
}

export interface MemberLike {
  id: string;
  familyId: string;
  userId: string;
  role?: 'OWNER' | 'MEMBER' | null;
  familyOwnerId: (string | null)[];
}

export interface TransferDeps {
  getFamily: (id: string) => Promise<FamilyLike | null>;
  listMembers: (familyId: string) => Promise<MemberLike[]>;
  updateMember: (input: {
    id: string;
    role?: 'OWNER' | 'MEMBER';
    familyOwnerId?: string[];
  }) => Promise<void>;
  updateFamily: (input: {
    id: string;
    ownerId: string;
    owner: string;
  }) => Promise<FamilyLike>;
}

export const NOT_OWNER_MESSAGE = '관리자만 넘길 수 있어요.';
export const NOT_SAME_FAMILY_MESSAGE =
  '같은 가족의 구성원에게만 넘길 수 있어요.';
export const FAMILY_NOT_FOUND_MESSAGE = '가족을 찾지 못했어요.';

// 소유자 필드 값. 스키마가 identityClaim('sub')이라 sub 그대로 저장된다.
// 기존 값이 'sub::username' 형식이면 새 관리자의 username을 알 수 없으므로
// 잘못된 값을 쓰지 않도록 멈춘다 (배포 전 데이터에서 확인할 것).
export function ownerFieldValue(
  currentOwner: string | null | undefined,
  newOwnerSub: string,
): string {
  if (currentOwner && currentOwner.includes('::')) {
    throw new Error(
      '가족 소유자 필드 형식(sub::username)을 확인해야 해요. 관리자에게 문의해주세요.',
    );
  }
  return newOwnerSub;
}

function sameOwnerList(list: (string | null)[], ownerSub: string): boolean {
  return list.length === 1 && list[0] === ownerSub;
}

// 순서: ① 새 관리자 role=OWNER ② Family.ownerId·owner ③ 모든 구성원 familyOwnerId
// ④ 부른 사람 role=MEMBER. 각 단계는 이미 된 상태면 건너뛰어서, 중간에 실패해도
// 다시 부르면 끝까지 맞춰진다. 부른 사람의 role은 마지막에 바꾸므로 재시도 때도
// 관리자 검증을 통과한다.
export async function transferFamilyOwnership(
  deps: TransferDeps,
  args: { callerSub: string; familyId: string; newOwnerMemberId: string },
): Promise<FamilyLike> {
  const family = await deps.getFamily(args.familyId);
  if (!family) {
    throw new Error(FAMILY_NOT_FOUND_MESSAGE);
  }
  const members = await deps.listMembers(args.familyId);
  const caller = members.find(m => m.userId === args.callerSub);
  const target = members.find(m => m.id === args.newOwnerMemberId);

  // 이미 끝까지 넘어간 뒤 다시 불렀을 때: 부른 사람은 MEMBER지만 결과가 맞으면 그대로 돌려준다.
  const alreadyDone =
    caller !== undefined &&
    target !== undefined &&
    caller.id !== target.id &&
    target.role === 'OWNER' &&
    caller.role === 'MEMBER' &&
    family.ownerId === target.userId &&
    members.every(m => sameOwnerList(m.familyOwnerId, target.userId));
  if (alreadyDone) {
    return family;
  }

  if (!caller || caller.role !== 'OWNER') {
    throw new Error(NOT_OWNER_MESSAGE);
  }
  if (!target || target.familyId !== args.familyId || target.id === caller.id) {
    throw new Error(NOT_SAME_FAMILY_MESSAGE);
  }

  // ① 새 관리자
  if (target.role !== 'OWNER') {
    await deps.updateMember({ id: target.id, role: 'OWNER' });
  }

  // ② 가족의 관리자와 소유자 필드
  const owner = ownerFieldValue(family.owner, target.userId);
  let updatedFamily = family;
  if (family.ownerId !== target.userId || family.owner !== owner) {
    updatedFamily = await deps.updateFamily({
      id: family.id,
      ownerId: target.userId,
      owner,
    });
  }

  // ③ 모든 구성원의 familyOwnerId (관리자가 구성원 기록을 읽고 지울 수 있게)
  for (const member of members) {
    if (!sameOwnerList(member.familyOwnerId, target.userId)) {
      await deps.updateMember({
        id: member.id,
        familyOwnerId: [target.userId],
      });
    }
  }

  // ④ 부른 사람
  await deps.updateMember({ id: caller.id, role: 'MEMBER' });

  return updatedFamily;
}
