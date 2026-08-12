import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signOut,
  getCurrentUser,
  type SignUpOutput,
  type ConfirmSignUpOutput,
  type SignInOutput,
  type GetCurrentUserOutput,
} from 'aws-amplify/auth';

export async function signUpUser(
  email: string,
  password: string,
): Promise<SignUpOutput> {
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: { email },
    },
  });
}

export async function confirmSignUpUser(
  email: string,
  confirmationCode: string,
): Promise<ConfirmSignUpOutput> {
  return confirmSignUp({ username: email, confirmationCode });
}

export async function resendSignUpCodeForUser(email: string): Promise<void> {
  await resendSignUpCode({ username: email });
}

export async function signInUser(
  email: string,
  password: string,
): Promise<SignInOutput> {
  return signIn({ username: email, password });
}

export async function signOutUser(): Promise<void> {
  await signOut();
}

export async function getCurrentAuthUser(): Promise<GetCurrentUserOutput> {
  return getCurrentUser();
}

export function getAuthErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
