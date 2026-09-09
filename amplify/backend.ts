import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { taskReminder } from './functions/taskReminder/resource';
import { createUserOnLogin } from './functions/createUserOnLogin/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  taskReminder,
  createUserOnLogin,
});
