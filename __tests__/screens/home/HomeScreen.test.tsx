import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../../src/screens/home/HomeScreen';
import { useFamilyStore } from '../../../src/store/useFamilyStore';
import { listRoomsForFamily, createRoom } from '../../../src/api/room';
import { listChoresForRoom } from '../../../src/api/chore';
import { resetAllStores } from '../../../src/test-utils/resetStores';
import { createMockNavigation } from '../../../src/test-utils/navigation';
import type { FamilyRow } from '../../../src/api/family';
import type { RoomRow } from '../../../src/api/room';
import type { ChoreRow } from '../../../src/api/chore';

jest.mock('../../../src/api/family');
jest.mock('../../../src/api/room', () => ({
  ...jest.requireActual('../../../src/api/room'),
  listRoomsForFamily: jest.fn(),
  createRoom: jest.fn(),
}));
jest.mock('../../../src/api/chore', () => ({
  ...jest.requireActual('../../../src/api/chore'),
  listChoresForRoom: jest.fn(),
}));

const mockedListRoomsForFamily = listRoomsForFamily as jest.Mock;
const mockedCreateRoom = createRoom as jest.Mock;
const mockedListChoresForRoom = listChoresForRoom as jest.Mock;

const family: FamilyRow = {
  id: 'f1',
  name: 'TestFamily',
  inviteCode: 'ABC123',
  ownerId: 'u1',
} as FamilyRow;

const bedroom: RoomRow = { id: 'r1', familyId: 'f1', roomType: 'BEDROOM', label: null } as RoomRow;

const chore: ChoreRow = {
  id: 'c1',
  roomId: 'r1',
  title: '침구 햇빛살균',
  description: null,
  recurrenceType: 'INTERVAL',
  intervalValue: 1,
  intervalUnit: 'WEEK',
  months: null,
  nextDueDate: '2000-01-01',
} as ChoreRow;

function renderHomeScreen(navigation = createMockNavigation<'HomeMain'>()) {
  return {
    ...render(<HomeScreen navigation={navigation} route={{} as never} />),
    navigation,
  };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
  });

  test('방 목록을 타일로 보여주고, 오늘 해야 할 집안일이 있으면 표시를 남긴다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([chore]);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText, getByTestId } = renderHomeScreen();

    await waitFor(() => expect(getByText('침실')).toBeTruthy());
    expect(getByTestId('due-badge-r1')).toBeTruthy();
  });

  test('오늘 해야 할 집안일이 없으면 표시를 남기지 않는다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([]);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText, queryByTestId } = renderHomeScreen();

    await waitFor(() => expect(getByText('침실')).toBeTruthy());
    expect(queryByTestId('due-badge-r1')).toBeNull();
  });

  test('방을 탭하면 RoomDetail로 이동한다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([]);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText, navigation } = renderHomeScreen();
    await waitFor(() => expect(getByText('침실')).toBeTruthy());
    fireEvent.press(getByText('침실'));

    expect(navigation.navigate).toHaveBeenCalledWith('RoomDetail', { roomId: 'r1' });
  });

  test('+ 방 추가로 방을 만들면 createRoom을 호출한다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([]);
    mockedListChoresForRoom.mockResolvedValue([]);
    mockedCreateRoom.mockResolvedValue(bedroom);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText } = renderHomeScreen();
    await waitFor(() => expect(getByText('+ 방 추가')).toBeTruthy());

    fireEvent.press(getByText('+ 방 추가'));
    fireEvent.press(getByText('침실'));
    fireEvent.press(getByText('추가'));

    await waitFor(() =>
      expect(mockedCreateRoom).toHaveBeenCalledWith('f1', 'BEDROOM', 'BIG', undefined),
    );
  });
});
