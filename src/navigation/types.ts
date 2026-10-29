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
    // 완료 전 기한
    previousDueDate: string;
    // light: 가벼운 시트, full: 오늘의 마지막 할 일 (전체 화면 + 폭죽)
    variant: CompleteVariant;
  };
  WidgetPrompt: undefined;
  TaskForm: { taskId?: string; roomId?: string } | undefined;
  MascotDetail: undefined;
  MascotCollection: undefined;
  FamilyMain: undefined;
  AddFamilyMember: undefined;
  ScanFamilyQr: undefined;
  EnterFamilyCode: undefined;
  SettingsMain: undefined;
};
