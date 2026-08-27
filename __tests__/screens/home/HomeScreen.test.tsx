import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../../src/screens/home/HomeScreen';
import { useFamilyStore } from '../../../src/store/useFamilyStore';
import { listRoomsForFamily, createRoom, deleteRoom } from '../../../src/api/room';
import { listChoresForRoom, completeChore } from '../../../src/api/chore';
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
  deleteRoom: jest.fn(),
}));
jest.mock('../../../src/api/chore', () => ({
  ...jest.requireActual('../../../src/api/chore'),
  listChoresForRoom: jest.fn(),
  completeChore: jest.fn(),
}));

const mockedListRoomsForFamily = listRoomsForFamily as jest.Mock;
const mockedCreateRoom = createRoom as jest.Mock;
const mockedDeleteRoom = deleteRoom as jest.Mock;
const mockedListChoresForRoom = listChoresForRoom as jest.Mock;
const mockedCompleteChore = completeChore as jest.Mock;

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

function renderHomeScreen() {
  return render(
    <HomeScreen navigation={createMockNavigation()} route={{} as never} />,
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
  });

  test('방별로 집안일 목록을 그룹핑해서 보여준다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([chore]);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText } = renderHomeScreen();

    await waitFor(() => expect(getByText('침구 햇빛살균')).toBeTruthy());
    expect(getByText('침실')).toBeTruthy();
  });

  test('완료 버튼을 탭하면 completeChore를 호출한다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([chore]);
    mockedCompleteChore.mockResolvedValue(undefined);
    useFamilyStore.setState({ status: 'joined', family });

    const { getByText } = renderHomeScreen();
    await waitFor(() => expect(getByText('완료')).toBeTruthy());
    fireEvent.press(getByText('완료'));

    await waitFor(() => expect(mockedCompleteChore).toHaveBeenCalledWith(chore));
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
      expect(mockedCreateRoom).toHaveBeenCalledWith('f1', 'BEDROOM', 'NORMAL', undefined),
    );
  });

  test('방 삭제를 탭하면 확인 후 deleteRoom을 호출한다', async () => {
    mockedListRoomsForFamily.mockResolvedValue([bedroom]);
    mockedListChoresForRoom.mockResolvedValue([]);
    mockedDeleteRoom.mockResolvedValue(undefined);
    useFamilyStore.setState({ status: 'joined', family });
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(b => b.style === 'destructive')?.onPress?.();
    });

    const { getByText } = renderHomeScreen();
    await waitFor(() => expect(getByText('삭제')).toBeTruthy());
    fireEvent.press(getByText('삭제'));

    await waitFor(() => expect(mockedDeleteRoom).toHaveBeenCalledWith('r1'));
    jest.restoreAllMocks();
  });
});
