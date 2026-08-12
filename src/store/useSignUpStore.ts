import { create } from 'zustand';
import {
  signUpUser,
  confirmSignUpUser,
  resendSignUpCodeForUser,
  getAuthErrorMessage,
} from '../api/auth';
import { isLoginIdAvailable, createLoginMapping } from '../api/userLogin';
import { validateSignUpForm } from '../utils/validation';

type Step = 'form' | 'confirm';

interface SignUpState {
  step: Step;
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
  confirmationCode: string;
  loading: boolean;
  error: string | null;

  setLoginId: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setConfirmationCode: (value: string) => void;

  submitSignUp: () => Promise<boolean>;
  submitConfirmation: () => Promise<boolean>;
  resendCode: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  step: 'form' as Step,
  loginId: '',
  email: '',
  password: '',
  confirmPassword: '',
  confirmationCode: '',
  loading: false,
  error: null as string | null,
};

export const useSignUpStore = create<SignUpState>((set, get) => ({
  ...initialState,

  setLoginId: loginId => set({ loginId, error: null }),
  setEmail: email => set({ email, error: null }),
  setPassword: password => set({ password, error: null }),
  setConfirmPassword: confirmPassword => set({ confirmPassword, error: null }),
  setConfirmationCode: confirmationCode => set({ confirmationCode, error: null }),

  submitSignUp: async () => {
    const { loginId, email, password, confirmPassword } = get();
    const validationError = validateSignUpForm(loginId, email, password, confirmPassword);
    if (validationError) {
      set({ error: validationError });
      return false;
    }
    set({ loading: true, error: null });
    try {
      const available = await isLoginIdAvailable(loginId);
      if (!available) {
        set({ loading: false, error: '이미 사용 중인 아이디입니다.' });
        return false;
      }
      await signUpUser(email, password);
      set({ loading: false, step: 'confirm' });
      return true;
    } catch (err) {
      set({ loading: false, error: getAuthErrorMessage(err) });
      return false;
    }
  },

  submitConfirmation: async () => {
    const { loginId, email, confirmationCode } = get();
    if (!confirmationCode.trim()) {
      set({ error: '인증 코드를 입력해주세요.' });
      return false;
    }
    set({ loading: true, error: null });
    try {
      const result = await confirmSignUpUser(email, confirmationCode);
      if (result.isSignUpComplete) {
        try {
          await createLoginMapping(loginId, email);
        } catch (mappingErr) {
          set({ loading: false, error: getAuthErrorMessage(mappingErr) });
          return true;
        }
      }
      set({ loading: false });
      return result.isSignUpComplete;
    } catch (err) {
      set({ loading: false, error: getAuthErrorMessage(err) });
      return false;
    }
  },

  resendCode: async () => {
    const { email } = get();
    set({ loading: true, error: null });
    try {
      await resendSignUpCodeForUser(email);
      set({ loading: false });
    } catch (err) {
      set({ loading: false, error: getAuthErrorMessage(err) });
    }
  },

  reset: () => set(initialState),
}));
