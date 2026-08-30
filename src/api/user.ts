import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser } from './auth';
import { throwIfErrors } from './chore';

const client = generateClient<Schema>();

export async function ensureUserExists(): Promise<void> {
  const user = await getCurrentAuthUser();
  const { data: existing, errors: getErrors } = await client.models.User.get({
    id: user.userId,
  });
  throwIfErrors(getErrors, '사용자 정보를 확인하지 못했습니다.');
  if (existing) {
    return;
  }

  const attributes = await fetchUserAttributes();
  const displayName = attributes.name ?? attributes.email ?? '이름 없음';
  const { errors: createErrors } = await client.models.User.create({
    id: user.userId,
    email: attributes.email,
    displayName,
  });
  throwIfErrors(createErrors, '사용자 등록에 실패했습니다.');
}
