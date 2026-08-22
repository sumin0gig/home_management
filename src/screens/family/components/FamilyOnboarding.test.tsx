import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FamilyOnboarding from './FamilyOnboarding';
import { createFamily, getMyFamily, listFamilyMembers } from '../../../api/family';
import { fetchDisplayName, signOutUser } from '../../../api/auth';
import { createRoom } from '../../../api/room';
import { resetAllStores } from '../../../test-utils/resetStores';

jest.mock('../../../api/family');
jest.mock('../../../api/auth');
jest.mock('../../../api/room', () => ({
  ...jest.requireActual('../../../api/room'),
  createRoom: jest.fn(),
}));

const mockedCreateFamily = createFamily as jest.Mock;
const mockedGetMyFamily = getMyFamily as jest.Mock;
const mockedListFamilyMembers = listFamilyMembers as jest.Mock;
const mockedFetchDisplayName = fetchDisplayName as jest.Mock;
const mockedCreateRoom = createRoom as jest.Mock;
const mockedSignOutUser = signOutUser as jest.Mock;

describe('FamilyOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
    mockedFetchDisplayName.mockResolvedValue('테스트유저');
    mockedGetMyFamily.mockResolvedValue(null);
    mockedListFamilyMembers.mockResolvedValue([]);
  });

  test('초기 상태에는 방 추가 안내 문구를 표시한다', () => {
    const { getByText } = render(<FamilyOnboarding />);
    expect(getByText('최소 한 개의 방을 추가해주세요.')).toBeTruthy();
  });

  test('같은 방 종류를 여러 번 추가할 수 있다', () => {
    const { getByText, getAllByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('+ 침실'));
    fireEvent.press(getByText('+ 침실'));
    expect(getAllByText('침실')).toHaveLength(2);
  });

  test('이름이나 방이 없으면 만들기가 동작하지 않는다', () => {
    const { getByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('만들기'));
    expect(mockedCreateFamily).not.toHaveBeenCalled();
  });

  test('이름과 방을 채우면 가족과 방을 생성한다', async () => {
    mockedCreateFamily.mockResolvedValue({
      id: 'f1',
      name: '우리집',
      inviteCode: 'ABC123',
      ownerId: 'u1',
    });
    mockedCreateRoom.mockResolvedValue({ id: 'r1', familyId: 'f1', roomType: 'BEDROOM', label: null });

    const { getByText, getByPlaceholderText } = render(<FamilyOnboarding />);
    fireEvent.changeText(getByPlaceholderText('가족 이름'), '우리집');
    fireEvent.press(getByText('+ 침실'));
    fireEvent.press(getByText('만들기'));

    await waitFor(() =>
      expect(mockedCreateFamily).toHaveBeenCalledWith('우리집', '테스트유저'),
    );
    expect(mockedCreateRoom).toHaveBeenCalledWith('f1', 'BEDROOM', undefined);
  });

  test('로그아웃 링크를 탭하면 signOutUser를 호출한다', () => {
    mockedSignOutUser.mockResolvedValue(undefined);
    const { getByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('로그아웃'));
    expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
  });
});
