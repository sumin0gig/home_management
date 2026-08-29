import { defineFunction } from '@aws-amplify/backend';

export const createUserOnLogin = defineFunction({
  name: 'create-user-on-login',
  entry: './handler.ts',
});
