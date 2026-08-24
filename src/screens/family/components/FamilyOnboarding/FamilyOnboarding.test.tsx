import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FamilyOnboarding from './FamilyOnboarding';
import { createFamily, joinFamilyByInviteCode, getMyFamily, listFamilyMembers } from '../../../../api/family';
import { fetchDisplayName, signOutUser } from '../../../../api/auth';
import { resetAllStores } from '../../../../test-utils/resetStores';

jest.mock('../../../../api/family');
jest.mock('../../../../api/auth');

const mockedCreateFamily = createFamily as jest.Mock;
const mockedJoinFamily = joinFamilyByInviteCode as jest.Mock;
const mockedGetMyFamily = getMyFamily as jest.Mock;
const mockedListFamilyMembers = listFamilyMembers as jest.Mock;
const mockedFetchDisplayName = fetchDisplayName as jest.Mock;
const mockedSignOutUser = signOutUser as jest.Mock;

describe('FamilyOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
    mockedFetchDisplayName.mockResolvedValue('테스트유저');
    mockedGetMyFamily.mockResolvedValue(null);
    mockedListFamilyMembers.mockResolvedValue([]);
  });

  test('가족 이름이 없으면 만들기가 동작하지 않는다', () => {
    const { getByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('만들기'));
    expect(mockedCreateFamily).not.toHaveBeenCalled();
  });

  test('가족 이름을 입력하면 가족을 생성한다', async () => {
    mockedCreateFamily.mockResolvedValue({
      id: 'f1',
      name: '우리집',
      inviteCode: 'ABC123',
      ownerId: 'u1',
    });

    const { getByText, getByPlaceholderText } = render(<FamilyOnboarding />);
    fireEvent.changeText(getByPlaceholderText('가족 이름'), '우리집');
    fireEvent.press(getByText('만들기'));

    await waitFor(() =>
      expect(mockedCreateFamily).toHaveBeenCalledWith('우리집', '테스트유저'),
    );
  });

  test('초대 코드가 없으면 참여하기가 동작하지 않는다', () => {
    const { getByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('참여하기'));
    expect(mockedJoinFamily).not.toHaveBeenCalled();
  });

  test('초대 코드를 입력하면 가족에 참여한다', async () => {
    mockedJoinFamily.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<FamilyOnboarding />);
    fireEvent.changeText(getByPlaceholderText('초대 코드'), 'ABC123');
    fireEvent.press(getByText('참여하기'));

    await waitFor(() =>
      expect(mockedJoinFamily).toHaveBeenCalledWith('ABC123', '테스트유저'),
    );
  });

  test('로그아웃 링크를 탭하면 signOutUser를 호출한다', () => {
    mockedSignOutUser.mockResolvedValue(undefined);
    const { getByText } = render(<FamilyOnboarding />);
    fireEvent.press(getByText('로그아웃'));
    expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
  });
});
