import { defineFunction } from '@aws-amplify/backend';

export const joinFamilyByCode = defineFunction({
  name: 'join-family-by-code',
  entry: './handler.ts',
});
