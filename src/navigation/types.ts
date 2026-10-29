export type AuthStackParamList = {
  Login: undefined;
};

export type CompleteVariant = 'light' | 'full';

export type MainStackParamList = {
  HomeMain: undefined;
  RoomDetail: { roomId: string; hasMascot?: boolean };
  RoomEdit: undefined;
  TaskSheet: { taskId: string };
  CompleteCheck: {
    taskId: string;
    happinessBefore?: number;
    // 완료 전 기한 (05에서 축하 문구에 쓴다)
    previousDueDate?: string;
    // light: 가볍게 축하, full: 오늘의 마지막 할 일 (05에서 모양을 만든다)
    variant?: CompleteVariant;
  };
  TaskForm: { taskId?: string; roomId?: string } | undefined;
  MascotDetail: undefined;
  MascotCollection: undefined;
  FamilyMain: undefined;
  AddFamilyMember: undefined;
  ScanFamilyQr: undefined;
  EnterFamilyCode: undefined;
  SettingsMain: undefined;
};
