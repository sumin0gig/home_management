export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLoginId(loginId: string): string | null {
  if (!/^[A-Za-z0-9_]{4,20}$/.test(loginId.trim())) {
    return '아이디는 영문/숫자/밑줄 4~20자로 입력해주세요.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return '비밀번호는 영문과 숫자를 포함해야 합니다.';
  }
  return null;
}

export function validateSignUpForm(
  loginId: string,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  if (!loginId.trim() || !email.trim() || !password || !confirmPassword) {
    return '모든 항목을 입력해주세요.';
  }
  const loginIdError = validateLoginId(loginId);
  if (loginIdError) {
    return loginIdError;
  }
  if (!isValidEmail(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }
  if (password !== confirmPassword) {
    return '비밀번호가 일치하지 않습니다.';
  }
  return null;
}
