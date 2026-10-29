import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyLookup } from "../../store/useFamilyStore";

// 가족 시작 흐름: 고르기 → 가족 이름(새로 시작) / 초대 코드 → (QR) → 참여 확인(참여)
export type FamilyOnboardingParamList = {
  Choose: undefined;
  FamilyName: undefined;
  InviteCode: undefined;
  ScanFamilyQr: undefined;
  JoinConfirm: { lookup: FamilyLookup };
};

export type FamilyOnboardingScreenProps<
  Screen extends keyof FamilyOnboardingParamList,
> = NativeStackScreenProps<FamilyOnboardingParamList, Screen>;

// 진행 막대: 새로 시작은 3단계(가족 이름 → 집 → 마스코트), 참여는 2단계(참여 → 마스코트)
export const CREATE_TOTAL_STEPS = 3;
export const JOIN_TOTAL_STEPS = 2;
