import { create } from 'zustand';
import { Hub } from 'aws-amplify/utils';
import { getCurrentAuthUser } from '../../actions';
import { useFamilyStore } from './useFamilyStore';
import { useTaskStore } from './useTaskStore';
import { useRoomStore } from './useRoomStore';
import { useMascotStore } from './useMascotStore';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  // 회원 탈퇴로 로그아웃됐는지 (메모리에만). 로그인 화면이 완료 안내를 한 번 보여준다.
  accountDeleted: boolean;
  setAccountDeleted: (deleted: boolean) => void;
  checkAuthStatus: () => Promise<void>;
  subscribeToAuthEvents: () => () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  status: 'loading',
  accountDeleted: false,
  setAccountDeleted: (deleted: boolean) => set({ accountDeleted: deleted }),

  checkAuthStatus: () =>
    getCurrentAuthUser()
    .then(() => set({ status: 'signedIn' }))
    .catch(() => set({ status: 'signedOut' })),

  subscribeToAuthEvents: () => {
    return Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        set({ status: 'signedIn' });
      } else if (payload.event === 'signedOut') {
        set({ status: 'signedOut' });
        useFamilyStore.getState().reset();
        useTaskStore.getState().reset();
        useRoomStore.getState().reset();
        useMascotStore.getState().reset();
      }
    });
  },
}));
