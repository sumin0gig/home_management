export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  HomeMain: undefined;
  RoomDetail: { roomId: string };
  RoomEdit: undefined;
  TaskDetail: { taskId: string };
  TaskForm: { taskId?: string; roomId?: string } | undefined;
  MascotDetail: undefined;
  FamilyMain: undefined;
  AddFamilyMember: undefined;
  ScanFamilyQr: undefined;
  EnterFamilyCode: undefined;
  SettingsMain: undefined;
};
