import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RoomSetupScreen from './RoomSetupScreen';
import { createRoom } from '../../../api/room';
import { signOutUser } from '../../../api/auth';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { resetAllStores } from '../../../test-utils/resetStores';
import type { FamilyRow } from '../../../api/family';

jest.mock('../../../api/auth');
jest.mock('../../../api/room', () => ({
  ...jest.requireActual('../../../api/room'),
  createRoom: jest.fn(),
}));

const mockedCreateRoom = createRoom as jest.Mock;
const mockedSignOutUser = signOutUser as jest.Mock;

const family: FamilyRow = {
  id: 'f1',
  name: 'TestFamily',
  inviteCode: 'ABC123',
  ownerId: 'u1',
} as FamilyRow;

describe('RoomSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState({ status: 'joined', family });
  });

  test('방을 하나도 추가하지 않으면 집 만들기가 비활성화된다', () => {
    const { getByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('집 만들기'));
    expect(mockedCreateRoom).not.toHaveBeenCalled();
  });

  test('방 종류를 탭하면 기본 크기(보통)로 타일이 추가된다', () => {
    const { getByText, getAllByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('+ 침실'));
    expect(getAllByText('침실')).toHaveLength(1);
    expect(getByText('보통')).toBeTruthy();
  });

  test('크기 스테퍼로 타일 크기를 조절할 수 있다', () => {
    const { getByText, queryByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('+ 침실'));
    fireEvent.press(getByText('▶'));
    expect(queryByText('보통')).toBeNull();
    expect(getByText('큼')).toBeTruthy();
  });

  test('제거 버튼을 탭하면 타일이 사라진다', () => {
    const { getByText, queryByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('+ 침실'));
    fireEvent.press(getByText('✕'));
    expect(queryByText('침실')).toBeNull();
  });

  test('타일을 추가하고 집 만들기를 누르면 addRoom이 호출된다', async () => {
    mockedCreateRoom.mockResolvedValue({
      id: 'r1',
      familyId: 'f1',
      roomType: 'BEDROOM',
      size: 'NORMAL',
      label: null,
    });

    const { getByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('+ 침실'));
    fireEvent.press(getByText('집 만들기'));

    await waitFor(() =>
      expect(mockedCreateRoom).toHaveBeenCalledWith('f1', 'BEDROOM', 'NORMAL', undefined),
    );
  });

  test('로그아웃 링크를 탭하면 signOutUser를 호출한다', () => {
    mockedSignOutUser.mockResolvedValue(undefined);
    const { getByText } = render(<RoomSetupScreen />);
    fireEvent.press(getByText('로그아웃'));
    expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
  });
});
