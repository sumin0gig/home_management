import { Linking } from 'react-native';

export const PRIVACY_POLICY_URL =
  'https://doc-hosting.flycricket.io/homemanagement-privacy-policy/e459a422-8a39-4f7f-a74d-ddf05d80f6bb/privacy';

export function openPrivacyPolicy(): Promise<void> {
  return Linking.openURL(PRIVACY_POLICY_URL);
}
