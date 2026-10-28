import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/transfer-family-ownership';
import {
  transferFamilyOwnership,
  type FamilyLike,
  type MemberLike,
} from './logic';

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

export const handler: Schema['transferFamilyOwnership']['functionHandler'] =
  async event => {
    const identity = event.identity as { sub?: string } | null | undefined;
    const callerSub = identity?.sub;
    if (!callerSub) {
      throw new Error('로그인이 필요해요.');
    }
    const { familyId, newOwnerMemberId } = event.arguments;

    const family = await transferFamilyOwnership(
      {
        getFamily: async id => {
          const { data, errors } = await client.models.Family.get({ id });
          throwIfErrors(errors, '가족을 불러오지 못했어요.');
          return data as FamilyLike | null;
        },
        listMembers: async id => {
          const results: MemberLike[] = [];
          let nextToken: string | null | undefined;
          do {
            const page = await client.models.FamilyMember.list({
              filter: { familyId: { eq: id } },
              nextToken,
            });
            throwIfErrors(page.errors, '구성원을 불러오지 못했어요.');
            results.push(...(page.data as MemberLike[]));
            nextToken = page.nextToken;
          } while (nextToken);
          return results;
        },
        updateMember: async input => {
          const { errors } = await client.models.FamilyMember.update(input);
          throwIfErrors(errors, '구성원을 바꾸지 못했어요.');
        },
        updateFamily: async input => {
          // owner는 Amplify가 만든 소유자 필드라 생성된 입력 타입에 없을 수 있다.
          const { data, errors } = await client.models.Family.update(
            input as Parameters<typeof client.models.Family.update>[0],
          );
          throwIfErrors(errors, '가족 관리자를 바꾸지 못했어요.');
          if (!data) {
            throw new Error('가족 관리자를 바꾸지 못했어요.');
          }
          return data as FamilyLike;
        },
      },
      { callerSub, familyId, newOwnerMemberId },
    );

    const { data, errors } = await client.models.Family.get({ id: family.id });
    throwIfErrors(errors, '가족을 불러오지 못했어요.');
    return data;
  };
