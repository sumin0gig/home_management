import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Family: a
    .model({
      name: a.string().required(),
      inviteCode: a.string().required(),
      ownerId: a.string().required(),
      members: a.hasMany('FamilyMember', 'familyId'),
      chores: a.hasMany('Chore', 'familyId'),
    })
    .secondaryIndexes(index => [index('inviteCode')])
    .authorization(allow => [
      allow.owner().identityClaim('sub').to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
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
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  Chore: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      title: a.string().required(),
      description: a.string(),
      recurrenceType: a.enum(['INTERVAL', 'YEARLY_MONTHS']),
      intervalValue: a.integer(),
      intervalUnit: a.enum(['DAY', 'WEEK', 'MONTH']),
      months: a.integer().array(),
      nextDueDate: a.date().required(),
      logs: a.hasMany('ChoreLog', 'choreId'),
    })
    .secondaryIndexes(index => [index('familyId')])
    .authorization(allow => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  ChoreLog: a
    .model({
      choreId: a.id().required(),
      chore: a.belongsTo('Chore', 'choreId'),
      completedBy: a.string().required(),
      completedByName: a.string().required(),
      completedAt: a.datetime().required(),
    })
    .secondaryIndexes(index => [index('choreId')])
    .authorization(allow => [
      allow.authenticated().to(['create', 'read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
