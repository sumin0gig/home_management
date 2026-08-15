import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Family: a
    .model({
      name: a.string().required(),
      inviteCode: a.string().required(),
      ownerId: a.string().required(),
      members: a.hasMany('FamilyMember', 'familyId'),
    })
    .secondaryIndexes(index => [index('inviteCode')])
    .authorization(allow => [
      allow.owner().identityClaim('sub').to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  FamilyMember: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      userId: a.string().required(),
      familyOwnerId: a.string().array().required(),
      displayName: a.string().required(),
      role: a.enum(['OWNER', 'MEMBER']),
    })
    .authorization(allow => [
      allow.owner().identityClaim('sub').to(['create', 'read', 'update', 'delete']),
      allow.ownersDefinedIn('familyOwnerId').identityClaim('sub').to(['read', 'delete']),
      allow.authenticated().to(['read', 'create']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
