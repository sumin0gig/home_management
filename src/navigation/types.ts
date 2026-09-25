export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  HomeMain: undefined;
  RoomDetail: { roomId: string; hasMascot?: boolean };
  RoomEdit: undefined;
  TaskDetail: { taskId: string };
  TaskForm: { taskId?: string; roomId?: string } | undefined;
  MascotDetail: undefined;
  MascotCollection: undefined;
  FamilyMain: undefined;
  AddFamilyMember: undefined;
  ScanFamilyQr: undefined;
  EnterFamilyCode: undefined;
  SettingsMain: undefined;
};
