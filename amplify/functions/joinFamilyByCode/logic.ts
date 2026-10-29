// 서버에서 초대 코드로 참여하기. 앱이 role·familyOwnerId를 마음대로 보내지
// 못하게 서버가 값을 정해서 구성원 기록을 만든다.

export interface JoinFamilyLike {
  id: string;
  ownerId: string;
}

export interface JoinDeps {
  findFamilyByCode: (inviteCode: string) => Promise<JoinFamilyLike | null>;
  countMembershipsOf: (userSub: string) => Promise<number>;
  getDisplayName: (userSub: string) => Promise<string | null>;
  createMember: (input: {
    familyId: string;
    userId: string;
    familyOwnerId: string[];
    displayName: string;
    role: 'MEMBER';
    // 본인이 자기 구성원 기록을 고치고 지울 수 있게 소유자 필드를 본인 sub로
    owner: string;
  }) => Promise<{ id: string }>;
}

export const ALREADY_IN_FAMILY_MESSAGE =
  '이미 가족에 속해 있어요. 다른 가족에 참여하려면 먼저 지금 가족을 떠나주세요.';
export const INVALID_CODE_MESSAGE =
  '코드를 다시 확인해주세요. 대문자와 숫자 6자리예요.';

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function joinFamilyByCode(
  deps: JoinDeps,
  args: { callerSub: string; inviteCode: string },
): Promise<{ familyId: string; memberId: string }> {
  const family = await deps.findFamilyByCode(
    normalizeInviteCode(args.inviteCode),
  );
  if (!family) {
    throw new Error(INVALID_CODE_MESSAGE);
  }
  if ((await deps.countMembershipsOf(args.callerSub)) > 0) {
    throw new Error(ALREADY_IN_FAMILY_MESSAGE);
  }
  const displayName =
    (await deps.getDisplayName(args.callerSub))?.trim() || '이름 없음';
  const member = await deps.createMember({
    familyId: family.id,
    userId: args.callerSub,
    familyOwnerId: [family.ownerId],
    displayName,
    role: 'MEMBER',
    owner: args.callerSub,
  });
  return { familyId: family.id, memberId: member.id };
}
