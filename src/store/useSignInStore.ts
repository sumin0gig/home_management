import { create } from 'zustand';
import { signInUser, getAuthErrorMessage } from '../api/auth';
import { resolveEmailByLoginId } from '../api/userLogin';

interface SignInState {
  loginId: string;
  password: string;
  loading: boolean;
  error: string | null;

  setLoginId: (value: string) => void;
  setPassword: (value: string) => void;

  submitSignIn: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  loginId: '',
  password: '',
  loading: false,
  error: null as string | null,
};

export const useSignInStore = create<SignInState>((set, get) => ({
  ...initialState,

  setLoginId: loginId => set({ loginId, error: null }),
  setPassword: password => set({ password, error: null }),

  submitSignIn: async () => {
    const { loginId, password } = get();
    if (!loginId.trim() || !password) {
      set({ error: '아이디와 비밀번호를 입력해주세요.' });
      return false;
    }
    set({ loading: true, error: null });
    try {
      const email = await resolveEmailByLoginId(loginId);
      if (!email) {
        set({ loading: false, error: '존재하지 않는 아이디입니다.' });
        return false;
      }
      await signInUser(email, password);
      set({ loading: false });
      return true;
    } catch (err) {
      set({ loading: false, error: getAuthErrorMessage(err) });
      return false;
    }
  },

  reset: () => set(initialState),
}));
