import { defineFunction } from '@aws-amplify/backend';

export const transferFamilyOwnership = defineFunction({
  name: 'transfer-family-ownership',
  entry: './handler.ts',
});
