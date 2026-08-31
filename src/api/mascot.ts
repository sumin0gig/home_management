import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentAuthUser } from './auth';
import { throwIfErrors } from './shared';

const client = generateClient<Schema>();

export type MascotRow = Schema['Mascot']['type'];

export interface MascotInput {
  earStyle: 'ROUND' | 'POINTY' | 'FLOPPY';
  tailStyle: 'STRAIGHT' | 'CURLY';
  fillColor?: string;
}

export async function getMyMascot(): Promise<MascotRow | null> {
  const user = await getCurrentAuthUser();
  const { data: mascots, errors } = await client.models.Mascot.list({
    filter: { userId: { eq: user.userId } },
  });
  throwIfErrors(errors, '마스코트 정보를 불러오지 못했습니다.');
  return mascots[0] ?? null;
}

export async function createMascot(input: MascotInput): Promise<MascotRow> {
  const user = await getCurrentAuthUser();
  const { data: mascot, errors } = await client.models.Mascot.create({
    userId: user.userId,
    ...input,
  });
  throwIfErrors(errors, '마스코트 생성에 실패했습니다.');
  if (!mascot) {
    throw new Error('마스코트 생성에 실패했습니다.');
  }
  return mascot;
}

export async function updateMascot(
  mascotId: string,
  input: Partial<MascotInput>,
): Promise<MascotRow> {
  const { data: mascot, errors } = await client.models.Mascot.update({
    id: mascotId,
    ...input,
  });
  throwIfErrors(errors, '마스코트 수정에 실패했습니다.');
  if (!mascot) {
    throw new Error('마스코트 수정에 실패했습니다.');
  }
  return mascot;
}
