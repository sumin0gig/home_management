import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * `domainPrefix` is required by the underlying construct whenever
 * `externalProviders` is set (@aws-amplify/auth-construct throws
 * 'Cognito Domain Prefix is missing when external providers are
 * configured.' otherwise), but the installed @aws-amplify/backend-auth
 * (1.9.4, latest as of writing) factory type omits it from
 * `externalProviders`. Assigning through this untyped-literal variable
 * (instead of an inline object) sidesteps the excess-property check so
 * the value still reaches the construct at runtime.
 */
const externalProviders = {
  google: {
    clientId: secret('GOOGLE_CLIENT_ID'),
    clientSecret: secret('GOOGLE_CLIENT_SECRET'),
    scopes: ['openid', 'email', 'profile'],
    attributeMapping: { email: 'email' },
  },
  callbackUrls: ['homemanagement://callback/'],
  logoutUrls: ['homemanagement://signout/'],
  domainPrefix: 'homemanagement-auth',
};

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 *
 * `email` stays enabled because Cognito requires at least one local
 * alias (email or phone) even when external providers are used — the
 * app itself never exposes a local sign-up/sign-in screen, only Google.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders,
  },
  groups: ['Admin'],
});
