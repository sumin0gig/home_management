import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser } from './auth';
import { throwIfErrors } from './chore';

const client = generateClient<Schema>();

export async function registerDeviceToken(token: string): Promise<void> {
  const user = await getCurrentAuthUser();
  const { data: existing, errors } = await client.models.DeviceToken.listDeviceTokenByUserId({
    userId: user.userId,
  });
  throwIfErrors(errors, '알림 등록 정보를 불러오지 못했습니다.');

  if (existing.some(d => d.token === token)) {
    return;
  }

  await Promise.all(existing.map(d => client.models.DeviceToken.delete({ id: d.id })));

  const { errors: createErrors } = await client.models.DeviceToken.create({
    userId: user.userId,
    token,
    platform: 'ANDROID',
  });
  throwIfErrors(createErrors, '알림 등록에 실패했습니다.');
}
