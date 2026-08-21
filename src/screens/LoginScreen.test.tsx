import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';
import { signInWithGoogle, getAuthErrorMessage } from '../api/auth';

jest.mock('../api/auth');

const mockedSignInWithGoogle = signInWithGoogle as jest.Mock;
const mockedGetAuthErrorMessage = getAuthErrorMessage as jest.Mock;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAuthErrorMessage.mockImplementation((err: Error) => err.message);
  });

  test('제목과 로그인 버튼을 표시한다', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('HomeManagement')).toBeTruthy();
    expect(getByText('Google로 로그인')).toBeTruthy();
  });

  test('버튼을 탭하면 signInWithGoogle을 호출한다', () => {
    mockedSignInWithGoogle.mockResolvedValueOnce(undefined);
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Google로 로그인'));
    expect(mockedSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  test('로그인 실패 시 에러 메시지를 표시한다', async () => {
    mockedSignInWithGoogle.mockRejectedValueOnce(new Error('로그인에 실패했습니다.'));
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Google로 로그인'));
    await waitFor(() => expect(getByText('로그인에 실패했습니다.')).toBeTruthy());
  });
});
