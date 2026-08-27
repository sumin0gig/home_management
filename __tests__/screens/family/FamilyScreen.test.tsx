import React from 'react';
import { render } from '@testing-library/react-native';
import FamilyScreen from '../../../src/screens/family/FamilyScreen';
import { useFamilyStore } from '../../../src/store/useFamilyStore';
import { resetAllStores } from '../../../src/test-utils/resetStores';
import type { FamilyRow, FamilyMemberRow } from '../../../src/api/family';

jest.mock('../../../src/api/family');

const family: FamilyRow = {
  id: 'f1',
  name: 'TestFamily',
  inviteCode: 'ABC123',
  ownerId: 'u1',
} as FamilyRow;

const membership: FamilyMemberRow = {
  id: 'm1',
  familyId: 'f1',
  userId: 'u1',
  displayName: 'me',
  role: 'OWNER',
} as FamilyMemberRow;

describe('FamilyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
  });

  // FamilyScreen은 드로워를 통해서만(=이미 가족에 속해 있을 때만) 도달하므로
  // 온보딩 분기 없이 항상 가족 홈(멤버 관리) 화면을 그대로 위임한다.
  test('가족 홈(멤버 관리) 화면을 렌더링한다', () => {
    useFamilyStore.setState({ status: 'joined', family, membership, members: [membership] });
    const { getByText } = render(<FamilyScreen />);
    expect(getByText(/TestFamily/)).toBeTruthy();
    expect(getByText('가족 떠나기')).toBeTruthy();
  });
});
