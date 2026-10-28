import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { taskReminder } from '../functions/taskReminder/resource';
import { createUserOnLogin } from '../functions/createUserOnLogin/resource';
import { transferFamilyOwnership } from '../functions/transferFamilyOwnership/resource';
import { joinFamilyByCode } from '../functions/joinFamilyByCode/resource';

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
          .to(['create', 'read', 'update', 'delete']),
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
        // 요일·날짜를 지정하면 다음 기한을 완료한 날이 아니라 달력 기준으로 계산한다.
        weekdays: a.integer().array(), // 0=일 … 6=토. INTERVAL + WEEK + intervalValue 1일 때만 사용
        monthDay: a.integer(), // 1~31, 말일은 -1. INTERVAL + MONTH 또는 YEARLY_MONTHS일 때만 사용
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

    // 관리자 넘기기. 관리자는 다른 사람의 구성원 기록과 남이 만든 Family를 고칠 수
    // 없어서 서버 함수가 대신 바꾼다 (검증·순서는 functions/transferFamilyOwnership/logic.ts).
    transferFamilyOwnership: a
      .mutation()
      .arguments({
        familyId: a.id().required(),
        newOwnerMemberId: a.id().required(),
      })
      .returns(a.ref('Family'))
      .authorization(allow => [allow.authenticated()])
      .handler(a.handler.function(transferFamilyOwnership)),

    // 서버에서 초대 코드로 참여하기. role·familyOwnerId를 서버가 정한다.
    joinFamilyByCode: a
      .mutation()
      .arguments({ inviteCode: a.string().required() })
      .returns(a.ref('Family'))
      .authorization(allow => [allow.authenticated()])
      .handler(a.handler.function(joinFamilyByCode)),

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
    allow.resource(transferFamilyOwnership).to(['query', 'mutate']),
    allow.resource(joinFamilyByCode).to(['query', 'mutate']),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
