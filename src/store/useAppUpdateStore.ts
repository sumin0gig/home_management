import { create } from 'zustand';
import { AppState } from 'react-native';
import { checkStoreUpdateAvailable } from '../../actions';

type AppUpdateStatus = 'checking' | 'upToDate' | 'updateRequired';

interface AppUpdateState {
  status: AppUpdateStatus;
  checkForUpdate: () => Promise<void>;
  subscribeToAppState: () => () => void;
}

export const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  status: 'checking',

  checkForUpdate: () => 
    checkStoreUpdateAvailable()
    .then( available => set({ status: available ? 'updateRequired' : 'upToDate' }) )
    .catch(() => {
      if (get().status === 'checking') {
        set({ status: 'upToDate' });
      }
    }),

  subscribeToAppState: () => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        get().checkForUpdate();
      }
    });
    return () => subscription.remove();
  },
}));
