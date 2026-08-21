import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import FamilyScreen from './FamilyScreen';
import { getMyFamily, listFamilyMembers } from '../../api/family';
import { resetAllStores } from '../../test-utils/resetStores';

jest.mock('../../api/family');

const mockedGetMyFamily = getMyFamily as jest.Mock;
const mockedListFamilyMembers = listFamilyMembers as jest.Mock;

describe('FamilyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
  });

  test('초기 로딩 중에는 스피너를 표시한다', () => {
    mockedGetMyFamily.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<FamilyScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  test('가족이 없으면 가족 만들기 화면을 보여준다', async () => {
    mockedGetMyFamily.mockResolvedValue(null);
    const { getByText } = render(<FamilyScreen />);
    await waitFor(() => expect(getByText('가족 만들기')).toBeTruthy());
  });

  test('가족이 있으면 가족 홈 화면을 보여준다', async () => {
    mockedGetMyFamily.mockResolvedValue({
      family: { id: 'f1', name: 'TestFamily', inviteCode: 'ABC123', ownerId: 'u1' },
      membership: { id: 'm1', familyId: 'f1', userId: 'u1', role: 'OWNER', displayName: 'me' },
    });
    mockedListFamilyMembers.mockResolvedValue([
      { id: 'm1', familyId: 'f1', userId: 'u1', role: 'OWNER', displayName: 'me' },
    ]);
    const { getByText } = render(<FamilyScreen />);
    await waitFor(() => expect(getByText(/TestFamily/)).toBeTruthy());
  });
});
