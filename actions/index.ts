// 서버(Amplify)·인증·외부 링크를 호출하는 API 함수 모음.
// 여기 함수들은 실패하면 error를 throw한다(registerDeviceToken만 예외)
// — 실패를 받아서 error 상태로 남기는 일은 이 함수들을 부르는 스토어 액션이 맡는다.
import { Linking, Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';
import SpInAppUpdates, {
  IAUAvailabilityStatus,
  IAUUpdateKind,
  type AndroidNeedsUpdateResponse,
} from 'sp-react-native-in-app-updates';
import { generateClient } from 'aws-amplify/data';
import {
  signInWithRedirect,
  signOut,
  deleteUser,
  getCurrentUser,
  fetchUserAttributes,
  type GetCurrentUserOutput,
} from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import type { TaskItemInput } from '../src/utils/date';

const client = generateClient<Schema>();
const inAppUpdates = new SpInAppUpdates(false);

type RoomRow = Schema['Room']['type'];
type RoomType = NonNullable<RoomRow['roomType']>;
type TaskRow = Schema['Task']['type'];
type TaskLogRow = Schema['TaskLog']['type'];
type TaskItemRow = Schema['TaskItem']['type'];

// ─── 공통 ────────────────────────────────────────────────────────────────

export function throwIfErrors(errors: unknown, fallbackMessage: string): void {
  if (errors && Array.isArray(errors) && errors.length > 0) {
    const message = (errors[0] as { message?: string })?.message;
    throw new Error(message ?? fallbackMessage);
  }
}

// ─── 인증 ────────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  await signInWithRedirect({ provider: 'Google' });
}

export async function signOutUser(): Promise<void> {
  await signOut();
}

export async function getCurrentAuthUser(): Promise<GetCurrentUserOutput> {
  return getCurrentUser();
}

export async function fetchDisplayName(): Promise<string> {
  const attributes = await fetchUserAttributes();
  return attributes.name ?? attributes.email ?? '이름 없음';
}

export function getAuthErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

// ─── 사용자 ──────────────────────────────────────────────────────────────

export async function ensureUserExists(): Promise<void> {
  const user = await getCurrentAuthUser();
  const { data: existing, errors: getErrors } = await client.models.User.get({
    id: user.userId,
  });
  throwIfErrors(getErrors, '사용자 정보를 확인하지 못했습니다.');
  if (existing) {
    return;
  }

  const attributes = await fetchUserAttributes();
  const displayName = attributes.name ?? attributes.email ?? '이름 없음';
  const { errors: createErrors } = await client.models.User.create({
    id: user.userId,
    email: attributes.email,
    displayName,
  });
  throwIfErrors(createErrors, '사용자 등록에 실패했습니다.');
}

// ─── 푸시 알림 토큰 ──────────────────────────────────────────────────────

// 호출하는 쪽(usePushNotifications)은 실패해도 할 일이 없으므로, 다른 API
// 함수와 달리 throw하지 않고 스스로 처리해 성공 여부만 돌려준다.
export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    const user = await getCurrentAuthUser();
    const { data: existing, errors } =
      await client.models.DeviceToken.listDeviceTokenByUserId({
        userId: user.userId,
      });
    throwIfErrors(errors, '알림 등록 정보를 불러오지 못했습니다.');

    if (existing.some(d => d.token === token)) {
      return true;
    }

    await Promise.all(
      existing.map(d => client.models.DeviceToken.delete({ id: d.id })),
    );

    const { errors: createErrors } = await client.models.DeviceToken.create({
      userId: user.userId,
      token,
      platform: 'ANDROID',
    });
    throwIfErrors(createErrors, '알림 등록에 실패했습니다.');
    return true;
  } catch {
    // 토큰 등록 실패는 앱 사용에 영향이 없어 무시한다 (다음 실행 때 다시 등록)
    return false;
  }
}

// ─── 외부 링크 ───────────────────────────────────────────────────────────

export const PRIVACY_POLICY_URL =
  'https://doc-hosting.flycricket.io/homemanagement-privacy-policy/e459a422-8a39-4f7f-a74d-ddf05d80f6bb/privacy';

export function openPrivacyPolicy(): Promise<void> {
  return Linking.openURL(PRIVACY_POLICY_URL);
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.homemanagement';

export function openPlayStore(): Promise<void> {
  return Linking.openURL(PLAY_STORE_URL);
}

// ─── 앱 업데이트 ─────────────────────────────────────────────────────────

export async function checkStoreUpdateAvailable(): Promise<boolean> {
  if( Platform.OS !== "android" ) return false;
  const need_update = (
    await inAppUpdates.checkNeedsUpdate({
    curVersion: getBuildNumber(),
  })) as AndroidNeedsUpdateResponse;

  return (
    need_update.shouldUpdate
    || need_update.other?.updateAvailability === IAUAvailabilityStatus.DEVELOPER_TRIGGERED
  );
}

export function startImmediateUpdate(): Promise<void> {
  return inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
}

// ─── 방 ──────────────────────────────────────────────────────────────────

export async function listRoomsForFamily(familyId: string): Promise<RoomRow[]> {
  const { data: rooms, errors } = await client.models.Room.listRoomByFamilyId({
    familyId,
  });
  throwIfErrors(errors, '방 목록을 불러오지 못했습니다.');
  return rooms;
}

// listRoomsForFamily와 달리 nextToken을 따라가며 모든 페이지를 모은다.
export async function listAllRoomsForFamily(
  familyId: string,
): Promise<RoomRow[]> {
  const results: RoomRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Room.listRoomByFamilyId(
      { familyId },
      { nextToken },
    );
    throwIfErrors(errors, '방 목록을 불러오지 못했습니다.');
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
}

// 방 하나를 그 안의 집안일(완료 기록·안내 항목 포함)까지 함께 지운다 (방 삭제, 회원 탈퇴에서 공용).
export async function deleteRoomWithChildren(roomId: string): Promise<void> {
  const taskIds = await listAllTaskIdsForRoom(roomId);
  await Promise.all(taskIds.map(taskId => deleteTaskWithChildren(taskId)));
  const { errors } = await client.models.Room.delete({ id: roomId });
  throwIfErrors(errors, '방 삭제에 실패했습니다.');
}

export async function listTaskTemplatesForRoomType(
  roomType: RoomType,
): Promise<Schema['TaskTemplate']['type'][]> {
  const { data: templates, errors } =
    await client.models.TaskTemplate.listTaskTemplateByRoomType({
      roomType,
    });
  throwIfErrors(errors, '집안일 템플릿을 불러오지 못했습니다.');
  return templates;
}

export async function listTaskTemplateItemsForTemplate(
  templateId: string,
): Promise<Schema['TaskTemplateItem']['type'][]> {
  const { data: items, errors } =
    await client.models.TaskTemplateItem.listTaskTemplateItemByTemplateId({
      templateId,
    });
  throwIfErrors(errors, '집안일 템플릿 항목을 불러오지 못했습니다.');
  return items;
}

// ─── 집안일 ──────────────────────────────────────────────────────────────

export async function listTasksForRoom(roomId: string): Promise<TaskRow[]> {
  const { data: tasks, errors } = await client.models.Task.listTaskByRoomId({
    roomId,
  });
  throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
  return tasks;
}

// listTasksForRoom과 달리 nextToken을 따라가며 모든 페이지의 id만 모은다.
export async function listAllTaskIdsForRoom(roomId: string): Promise<string[]> {
  const results: string[] = [];
  let nextToken: string | null | undefined;
  do {
    const {
      data,
      nextToken: token,
      errors,
    } = await client.models.Task.listTaskByRoomId({ roomId }, { nextToken });
    throwIfErrors(errors, '집안일 목록을 불러오지 못했습니다.');
    results.push(...data.map(task => task.id));
    nextToken = token;
  } while (nextToken);
  return results;
}

export async function listTaskLogs(
  taskId: string,
  limit = 5,
): Promise<TaskLogRow[]> {
  const { data: logs, errors } =
    await client.models.TaskLog.listTaskLogByTaskId({ taskId });
  throwIfErrors(errors, '완료 기록을 불러오지 못했습니다.');
  return [...logs]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);
}

export async function listTaskItems(taskId: string): Promise<TaskItemRow[]> {
  const { data: items, errors } =
    await client.models.TaskItem.listTaskItemByTaskId({ taskId });
  throwIfErrors(errors, '집안일 안내 항목을 불러오지 못했습니다.');
  return [...items].sort((a, b) => a.ord - b.ord);
}

// 안내 항목은 입력 순서(방법 → TIP)대로 ord를 매겨 저장한다.
export async function createTaskItems(
  taskId: string,
  items: TaskItemInput[],
): Promise<void> {
  const results = await Promise.all(
    items.map((item, index) =>
      client.models.TaskItem.create({
        taskId,
        type: item.type,
        content: item.content,
        ord: index,
      }),
    ),
  );
  results.forEach(result =>
    throwIfErrors(result.errors, '집안일 안내 항목 저장에 실패했습니다.'),
  );
}

export async function deleteAllTaskItemsForTask(taskId: string): Promise<void> {
  const items = await listTaskItems(taskId);
  const deleteResults = await Promise.all(
    items.map(item => client.models.TaskItem.delete({ id: item.id })),
  );
  deleteResults.forEach(result =>
    throwIfErrors(result.errors, '집안일 안내 항목 삭제에 실패했습니다.'),
  );
}

export async function deleteAllTaskLogsForTask(taskId: string): Promise<void> {
  let nextToken: string | null | undefined;
  do {
    const {
      data: logs,
      nextToken: token,
      errors,
    } = await client.models.TaskLog.listTaskLogByTaskId(
      { taskId },
      { nextToken },
    );
    throwIfErrors(errors, '완료 기록 삭제에 실패했습니다.');
    const deleteResults = await Promise.all(
      logs.map(log => client.models.TaskLog.delete({ id: log.id })),
    );
    deleteResults.forEach(result =>
      throwIfErrors(result.errors, '완료 기록 삭제에 실패했습니다.'),
    );
    nextToken = token;
  } while (nextToken);
}

// 집안일 하나를 완료 기록·안내 항목까지 함께 지운다 (집안일 삭제, 방 삭제에서 공용).
export async function deleteTaskWithChildren(taskId: string): Promise<void> {
  await Promise.all([
    deleteAllTaskLogsForTask(taskId),
    deleteAllTaskItemsForTask(taskId),
  ]);
  const { errors } = await client.models.Task.delete({ id: taskId });
  throwIfErrors(errors, '집안일 삭제에 실패했습니다.');
}

// ─── 회원 탈퇴 ───────────────────────────────────────────────────────────

// 내 데이터를 서버에서 지운 뒤 Cognito 계정까지 삭제한다. 스토어는 건드리지
// 않는다 — 마지막 deleteUser가 signOut까지 하므로 useAuthStore의 'signedOut'
// Hub 이벤트에서 모든 스토어가 초기화된다. 지울 대상은 매번 서버에서 다시
// 조회하므로, 중간에 실패해도 다시 호출하면 남은 것부터 이어서 지운다.
export async function deleteAccount(): Promise<void> {
  const user = await getCurrentAuthUser();

  const { data: memberships, errors } = await client.models.FamilyMember.list({
    filter: { userId: { eq: user.userId } },
  });
  throwIfErrors(errors, '가족 정보를 불러오지 못했습니다.');

  // 아무것도 지우기 전에 확인: 소유한 가족에 다른 구성원이 남아 있으면 탈퇴할 수
  // 없다 (가족을 지우면 그 구성원들의 방·집안일까지 사라지므로).
  const ownedMemberships = memberships.filter(m => m.role === 'OWNER');
  const ownedFamilyMembers = await Promise.all(
    ownedMemberships.map(async m => {
      const { data: members, errors: membersErrors } =
        await client.models.FamilyMember.list({
          filter: { familyId: { eq: m.familyId } },
        });
      throwIfErrors(membersErrors, '멤버 목록을 불러오지 못했습니다.');
      return members;
    }),
  );
  if (ownedFamilyMembers.flat().some(m => m.userId !== user.userId)) {
    throw new Error(
      '다른 구성원이 있는 가족의 소유자는 탈퇴할 수 없습니다. 가족 관리에서 구성원을 먼저 내보내 주세요.',
    );
  }

  // 소유한 가족은 방(집안일 포함)과 가족 자체까지 지우고, 참여한 가족에서는 내
  // 멤버 기록만 지운다 (useFamilyStore.leaveFamily와 같은 순서).
  await Promise.all(
    memberships.map(async membership => {
      const isOwner = membership.role === 'OWNER';
      if (isOwner) {
        const rooms = await listAllRoomsForFamily(membership.familyId);
        await Promise.all(rooms.map(room => deleteRoomWithChildren(room.id)));
      }
      const { errors: memberErrors } = await client.models.FamilyMember.delete({
        id: membership.id,
      });
      throwIfErrors(memberErrors, '가족을 떠나지 못했습니다.');
      if (isOwner) {
        const { errors: familyErrors } = await client.models.Family.delete({
          id: membership.familyId,
        });
        throwIfErrors(familyErrors, '가족 삭제에 실패했습니다.');
      }
    }),
  );

  const [mascotsResult, tokensResult, userResult] = await Promise.all([
    client.models.Mascot.listMascotByUserId({ userId: user.userId }),
    client.models.DeviceToken.listDeviceTokenByUserId({ userId: user.userId }),
    client.models.User.get({ id: user.userId }),
  ]);
  throwIfErrors(mascotsResult.errors, '마스코트 정보를 불러오지 못했습니다.');
  throwIfErrors(tokensResult.errors, '알림 등록 정보를 불러오지 못했습니다.');
  throwIfErrors(userResult.errors, '사용자 정보를 확인하지 못했습니다.');

  const deleteResults = await Promise.all([
    ...mascotsResult.data.map(m => client.models.Mascot.delete({ id: m.id })),
    ...tokensResult.data.map(d =>
      client.models.DeviceToken.delete({ id: d.id }),
    ),
    ...(userResult.data
      ? [client.models.User.delete({ id: user.userId })]
      : []),
  ]);
  deleteResults.forEach(result =>
    throwIfErrors(result.errors, '회원 정보 삭제에 실패했습니다.'),
  );

  await deleteUser();
}
