import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser } from './auth';
import { deleteAllChoresForFamily } from './chore';

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

function throwIfErrors(errors: unknown, fallbackMessage: string): void {
  if (errors && Array.isArray(errors) && errors.length > 0) {
    const message = (errors[0] as { message?: string })?.message;
    throw new Error(message ?? fallbackMessage);
  }
}

export async function createFamily(name: string, displayName: string): Promise<FamilyRow> {
  const user = await getCurrentAuthUser();
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

  return family;
}

export async function joinFamilyByInviteCode(
  inviteCode: string,
  displayName: string,
): Promise<FamilyRow> {
  const user = await getCurrentAuthUser();
  const normalizedCode = inviteCode.trim().toUpperCase();

  const { data: families, errors } = await client.models.Family.listFamilyByInviteCode({
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

  return family;
}

export async function getMyFamily(): Promise<{
  family: FamilyRow;
  membership: FamilyMemberRow;
} | null> {
  const user = await getCurrentAuthUser();
  const { data: memberships, errors } = await client.models.FamilyMember.list({
    filter: { userId: { eq: user.userId } },
  });
  throwIfErrors(errors, '가족 정보를 불러오지 못했습니다.');

  const membership = memberships[0];
  if (!membership) {
    return null;
  }

  const { data: family, errors: familyErrors } = await client.models.Family.get({
    id: membership.familyId,
  });
  throwIfErrors(familyErrors, '가족 정보를 불러오지 못했습니다.');
  if (!family) {
    return null;
  }

  return { family, membership };
}

export async function listFamilyMembers(familyId: string): Promise<FamilyMemberRow[]> {
  const { data: members, errors } = await client.models.FamilyMember.list({
    filter: { familyId: { eq: familyId } },
  });
  throwIfErrors(errors, '멤버 목록을 불러오지 못했습니다.');
  return members;
}

export async function renameFamily(familyId: string, name: string): Promise<void> {
  const { errors } = await client.models.Family.update({ id: familyId, name });
  throwIfErrors(errors, '가족 이름 변경에 실패했습니다.');
}

export async function removeFamilyMember(memberRecordId: string): Promise<void> {
  const { errors } = await client.models.FamilyMember.delete({ id: memberRecordId });
  throwIfErrors(errors, '멤버 제거에 실패했습니다.');
}

export async function leaveFamily(
  membership: FamilyMemberRow,
  otherMembersCount: number,
): Promise<void> {
  if (membership.role === 'OWNER' && otherMembersCount > 0) {
    throw new Error('다른 구성원이 있는 동안에는 소유자가 가족을 떠날 수 없습니다.');
  }

  if (membership.role === 'OWNER') {
    await deleteAllChoresForFamily(membership.familyId);
  }

  const { errors } = await client.models.FamilyMember.delete({ id: membership.id });
  throwIfErrors(errors, '가족을 떠나지 못했습니다.');

  if (membership.role === 'OWNER') {
    const { errors: deleteFamilyErrors } = await client.models.Family.delete({
      id: membership.familyId,
    });
    throwIfErrors(deleteFamilyErrors, '가족 삭제에 실패했습니다.');
  }
}
