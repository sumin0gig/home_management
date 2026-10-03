import { useFamilyStore } from '../store/useFamilyStore';
import { useTaskStore } from '../store/useTaskStore';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAppUpdateStore } from '../store/useAppUpdateStore';

export function resetAllStores(): void {
  useAppUpdateStore.setState({ status: 'checking' });
  useFamilyStore.getState().reset();
  useTaskStore.getState().reset();
  useRoomStore.getState().reset();
  useAuthStore.setState({ status: 'loading' });
}
