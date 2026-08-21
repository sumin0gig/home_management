import { useFamilyStore } from '../store/useFamilyStore';
import { useChoreStore } from '../store/useChoreStore';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';

export function resetAllStores(): void {
  useFamilyStore.getState().reset();
  useChoreStore.getState().reset();
  useRoomStore.getState().reset();
  useAuthStore.setState({ status: 'loading' });
}
