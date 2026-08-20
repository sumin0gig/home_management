import { create } from 'zustand';
import { Hub } from 'aws-amplify/utils';
import { getCurrentAuthUser } from '../api/auth';
import { useFamilyStore } from './useFamilyStore';
import { useChoreStore } from './useChoreStore';
import { useRoomStore } from './useRoomStore';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  checkAuthStatus: () => Promise<void>;
  subscribeToAuthEvents: () => () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  status: 'loading',

  checkAuthStatus: async () => {
    try {
      await getCurrentAuthUser();
      set({ status: 'signedIn' });
    } catch {
      set({ status: 'signedOut' });
    }
  },

  subscribeToAuthEvents: () => {
    return Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        set({ status: 'signedIn' });
      } else if (payload.event === 'signedOut') {
        set({ status: 'signedOut' });
        useFamilyStore.getState().reset();
        useChoreStore.getState().reset();
        useRoomStore.getState().reset();
      }
    });
  },
}));
