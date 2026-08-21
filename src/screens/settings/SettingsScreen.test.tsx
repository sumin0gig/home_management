import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from './SettingsScreen';
import { signOutUser, getAuthErrorMessage } from '../../api/auth';

jest.mock('../../api/auth');

const mockedSignOutUser = signOutUser as jest.Mock;
const mockedGetAuthErrorMessage = getAuthErrorMessage as jest.Mock;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAuthErrorMessage.mockImplementation((err: Error) => err.message);
  });

  test('로그아웃 버튼을 표시한다', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('로그아웃')).toBeTruthy();
  });

  test('버튼을 탭하면 signOutUser를 호출한다', () => {
    mockedSignOutUser.mockResolvedValueOnce(undefined);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('로그아웃'));
    expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
  });

  test('로그아웃 실패 시 에러 메시지를 표시한다', async () => {
    mockedSignOutUser.mockRejectedValueOnce(new Error('로그아웃에 실패했습니다.'));
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('로그아웃'));
    await waitFor(() => expect(getByText('로그아웃에 실패했습니다.')).toBeTruthy());
  });
});
