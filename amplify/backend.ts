import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { taskReminder } from './functions/taskReminder/resource';
import { createUserOnLogin } from './functions/createUserOnLogin/resource';
import { transferFamilyOwnership } from './functions/transferFamilyOwnership/resource';
import { joinFamilyByCode } from './functions/joinFamilyByCode/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  taskReminder,
  createUserOnLogin,
  transferFamilyOwnership,
  joinFamilyByCode,
});
