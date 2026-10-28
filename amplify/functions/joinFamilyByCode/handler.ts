import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/join-family-by-code';
import { joinFamilyByCode } from './logic';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env,
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

function throwIfErrors(errors: unknown, fallback: string): void {
  if (Array.isArray(errors) && errors.length > 0) {
    throw new Error((errors[0] as { message?: string }).message ?? fallback);
  }
}

export const handler: Schema['joinFamilyByCode']['functionHandler'] =
  async event => {
    const identity = event.identity as { sub?: string } | null | undefined;
    const callerSub = identity?.sub;
    if (!callerSub) {
      throw new Error('로그인이 필요해요.');
    }

    const { familyId } = await joinFamilyByCode(
      {
        findFamilyByCode: async inviteCode => {
          const { data, errors } =
            await client.models.Family.listFamilyByInviteCode({ inviteCode });
          throwIfErrors(errors, '초대 코드를 확인하지 못했어요.');
          return data[0] ?? null;
        },
        countMembershipsOf: async userSub => {
          const { data, errors } = await client.models.FamilyMember.list({
            filter: { userId: { eq: userSub } },
          });
          throwIfErrors(errors, '가족 정보를 확인하지 못했어요.');
          return data.length;
        },
        getDisplayName: async userSub => {
          const { data } = await client.models.User.get({ id: userSub });
          return data?.displayName ?? null;
        },
        createMember: async input => {
          // owner는 Amplify가 만든 소유자 필드라 생성된 입력 타입에 없을 수 있다.
          const { data, errors } = await client.models.FamilyMember.create(
            input as Parameters<typeof client.models.FamilyMember.create>[0],
          );
          throwIfErrors(errors, '가족 참여에 실패했어요.');
          if (!data) {
            throw new Error('가족 참여에 실패했어요.');
          }
          return data;
        },
      },
      { callerSub, inviteCode: event.arguments.inviteCode },
    );

    const { data, errors } = await client.models.Family.get({ id: familyId });
    throwIfErrors(errors, '가족을 불러오지 못했어요.');
    return data;
  };
