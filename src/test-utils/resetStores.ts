import { useFamilyStore } from '../store/useFamilyStore';
import { useTaskStore } from '../store/useTaskStore';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';

export function resetAllStores(): void {
  useFamilyStore.getState().reset();
  useTaskStore.getState().reset();
  useRoomStore.getState().reset();
  useAuthStore.setState({ status: 'loading' });
}
