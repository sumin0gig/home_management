import type { PostAuthenticationTriggerHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/create-user-on-login';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env,
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: PostAuthenticationTriggerHandler = async event => {
  const userId = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;
  const displayName = event.request.userAttributes.name ?? email ?? '이름 없음';

  const { data: existing } = await client.models.User.get({ userId });
  if (!existing) {
    await client.models.User.create({ userId, email, displayName });
  }

  return event;
};
