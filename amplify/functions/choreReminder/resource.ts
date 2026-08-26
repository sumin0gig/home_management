import { defineFunction, secret } from '@aws-amplify/backend';

export const choreReminder = defineFunction({
  name: 'chore-reminder',
  entry: './handler.ts',
  timeoutSeconds: 60,
  schedule: { cron: '0 9 * * ? *', timezone: 'Asia/Seoul' },
  environment: {
    FCM_SERVICE_ACCOUNT_JSON: secret('FCM_SERVICE_ACCOUNT_JSON'),
  },
});
