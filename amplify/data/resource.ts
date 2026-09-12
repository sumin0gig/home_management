import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { taskReminder } from '../functions/taskReminder/resource';
import { createUserOnLogin } from '../functions/createUserOnLogin/resource';

const schema = a
  .schema({
    User: a
      .model({
        email: a.string(),
        displayName: a.string(),
        mascot: a.hasOne('Mascot', 'userId'),
      })
      .authorization(allow => [
        allow
          .ownerDefinedIn('id')
          .identityClaim('sub')
          .to(['create', 'read', 'update']),
        allow.authenticated().to(['read']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    Mascot: a
      .model({
        userId: a.id().required(),
        user: a.belongsTo('User', 'userId'),
        earStyle: a.enum(['ROUND', 'POINTY', 'FLOPPY']),
        tailStyle: a.enum(['STRAIGHT', 'CURLY']),
        fillColor: a.string(),
        happiness: a.integer().default(0),
      })
      .secondaryIndexes(index => [index('userId')])
      .authorization(allow => [
        allow
          .ownerDefinedIn('userId')
          .identityClaim('sub')
          .to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    Family: a
      .model({
        name: a.string().required(),
        inviteCode: a.string().required(),
        ownerId: a.string().required(),
        members: a.hasMany('FamilyMember', 'familyId'),
        rooms: a.hasMany('Room', 'familyId'),
      })
      .secondaryIndexes(index => [index('inviteCode')])
      .authorization(allow => [
        allow
          .owner()
          .identityClaim('sub')
          .to(['create', 'read', 'update', 'delete']),
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
        allow
          .owner()
          .identityClaim('sub')
          .to(['create', 'read', 'update', 'delete']),
        allow
          .ownersDefinedIn('familyOwnerId')
          .identityClaim('sub')
          .to(['read', 'delete']),
        allow.authenticated().to(['read', 'create']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    Room: a
      .model({
        familyId: a.id().required(),
        family: a.belongsTo('Family', 'familyId'),
        roomType: a.enum([
          'LIVING_ROOM',
          'BATHROOM',
          'KITCHEN',
          'ENTRANCE',
          'BEDROOM',
          'GENERAL_ROOM',
        ]),
        x: a.integer().required(),
        y: a.integer().required(),
        width: a.integer().required(),
        height: a.integer().required(),
        label: a.string(),
        color: a.string(),
        tasks: a.hasMany('Task', 'roomId'),
      })
      .secondaryIndexes(index => [index('familyId')])
      .authorization(allow => [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    TaskTemplate: a
      .model({
        roomType: a.enum([
          'LIVING_ROOM',
          'BATHROOM',
          'KITCHEN',
          'ENTRANCE',
          'BEDROOM',
          'GENERAL_ROOM',
        ]),
        title: a.string().required(),
        recurrenceType: a.enum(['INTERVAL', 'YEARLY_MONTHS']),
        intervalValue: a.integer(),
        intervalUnit: a.enum(['DAY', 'WEEK', 'MONTH']),
        months: a.integer().array(),
        items: a.hasMany('TaskTemplateItem', 'templateId'),
      })
      .secondaryIndexes(index => [index('roomType')])
      .authorization(allow => [
        allow.authenticated().to(['read']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    TaskTemplateItem: a
      .model({
        templateId: a.id().required(),
        template: a.belongsTo('TaskTemplate', 'templateId'),
        type: a.enum(['DEFAULT', 'TIP']),
        content: a.string().required(),
        ord: a.integer().required(),
      })
      .secondaryIndexes(index => [index('templateId')])
      .authorization(allow => [
        allow.authenticated().to(['read']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    Task: a
      .model({
        roomId: a.id().required(),
        room: a.belongsTo('Room', 'roomId'),
        title: a.string().required(),
        recurrenceType: a.enum(['INTERVAL', 'YEARLY_MONTHS']),
        intervalValue: a.integer(),
        intervalUnit: a.enum(['DAY', 'WEEK', 'MONTH']),
        months: a.integer().array(),
        nextDueDate: a.date().required(),
        logs: a.hasMany('TaskLog', 'taskId'),
        items: a.hasMany('TaskItem', 'taskId'),
      })
      .secondaryIndexes(index => [index('roomId'), index('nextDueDate')])
      .authorization(allow => [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    TaskItem: a
      .model({
        taskId: a.id().required(),
        task: a.belongsTo('Task', 'taskId'),
        type: a.enum(['DEFAULT', 'TIP']),
        content: a.string().required(),
        ord: a.integer().required(),
      })
      .secondaryIndexes(index => [index('taskId')])
      .authorization(allow => [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    TaskLog: a
      .model({
        taskId: a.id().required(),
        task: a.belongsTo('Task', 'taskId'),
        completedBy: a.string().required(),
        completedByName: a.string().required(),
        completedAt: a.datetime().required(),
      })
      .secondaryIndexes(index => [index('taskId')])
      .authorization(allow => [
        allow.authenticated().to(['create', 'read', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),

    DeviceToken: a
      .model({
        userId: a.string().required(),
        token: a.string().required(),
        platform: a.enum(['ANDROID', 'IOS']),
      })
      .secondaryIndexes(index => [index('userId')])
      .authorization(allow => [
        allow
          .owner()
          .identityClaim('sub')
          .to(['create', 'read', 'update', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      ]),
  })
  .authorization(allow => [
    allow.resource(taskReminder).to(['query']),
    allow.resource(createUserOnLogin).to(['query', 'mutate']),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
