import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export async function isLoginIdAvailable(loginId: string): Promise<boolean> {
  const { data } = await client.models.UserLogin.get({ loginId });
  return data === null;
}

export async function createLoginMapping(
  loginId: string,
  email: string,
): Promise<void> {
  const { errors } = await client.models.UserLogin.create({ loginId, email });
  if (errors) {
    throw new Error(errors[0]?.message ?? 'ID 저장에 실패했습니다.');
  }
}

export async function resolveEmailByLoginId(
  loginId: string,
): Promise<string | null> {
  const { data } = await client.models.UserLogin.get({ loginId });
  return data?.email ?? null;
}
