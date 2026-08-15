import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  type GetCurrentUserOutput,
} from 'aws-amplify/auth';

export async function signInWithGoogle(): Promise<void> {
  await signInWithRedirect({ provider: 'Google' });
}

export async function signOutUser(): Promise<void> {
  await signOut();
}

export async function getCurrentAuthUser(): Promise<GetCurrentUserOutput> {
  return getCurrentUser();
}

export async function fetchDisplayName(): Promise<string> {
  const attributes = await fetchUserAttributes();
  return attributes.name ?? attributes.email ?? '이름 없음';
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
