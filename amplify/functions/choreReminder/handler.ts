import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/chore-reminder';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env,
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const NOTIFICATIONS_ENABLED = false;

function todaySeoulDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

async function listAll<T>(
  fetchPage: (
    nextToken?: string | null,
  ) => Promise<{ data: T[]; nextToken?: string | null; errors?: unknown }>,
): Promise<T[]> {
  const results: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const { data, nextToken: token, errors } = await fetchPage(nextToken);
    if (errors) {
      throw new Error(JSON.stringify(errors));
    }
    results.push(...data);
    nextToken = token;
  } while (nextToken);
  return results;
}

export const handler = async (): Promise<void> => {
  if (!NOTIFICATIONS_ENABLED) return;

  const today = todaySeoulDateString();

  const dueChores = await listAll(nextToken =>
    client.models.Chore.listChoreByNextDueDate(
      { nextDueDate: today },
      { nextToken },
    ),
  );
  if (dueChores.length === 0) {
    return;
  }

  const roomIds = [...new Set(dueChores.map(chore => chore.roomId))];
  const rooms = await Promise.all(
    roomIds.map(id => client.models.Room.get({ id })),
  );
  const roomIdToFamilyId = new Map<string, string>();
  rooms.forEach(({ data: room }) => {
    if (room) {
      roomIdToFamilyId.set(room.id, room.familyId);
    }
  });

  const familyIds = [...new Set(roomIdToFamilyId.values())];
  const membersByFamily = await Promise.all(
    familyIds.map(familyId =>
      listAll(nextToken =>
        client.models.FamilyMember.list({
          filter: { familyId: { eq: familyId } },
          nextToken,
        }),
      ),
    ),
  );
  const familyIdToUserIds = new Map<string, string[]>();
  familyIds.forEach((familyId, i) => {
    familyIdToUserIds.set(
      familyId,
      membersByFamily[i].map(member => member.userId),
    );
  });

  const userIdToChoreTitles = new Map<string, string[]>();
  dueChores.forEach(chore => {
    const familyId = roomIdToFamilyId.get(chore.roomId);
    if (!familyId) {
      return;
    }
    const userIds = familyIdToUserIds.get(familyId) ?? [];
    userIds.forEach(userId => {
      const titles = userIdToChoreTitles.get(userId) ?? [];
      titles.push(chore.title);
      userIdToChoreTitles.set(userId, titles);
    });
  });

  const userIds = [...userIdToChoreTitles.keys()];
  const tokensByUser = await Promise.all(
    userIds.map(userId =>
      listAll(nextToken =>
        client.models.DeviceToken.listDeviceTokenByUserId(
          { userId },
          { nextToken },
        ),
      ),
    ),
  );

  if (!getApps().length) {
    const serviceAccount = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON);
    initializeApp({ credential: cert(serviceAccount) });
  }
  const messaging = getMessaging();

  const sendPromises: Promise<unknown>[] = [];
  userIds.forEach((userId, i) => {
    const titles = userIdToChoreTitles.get(userId) ?? [];
    const tokens = tokensByUser[i];
    if (titles.length === 0 || tokens.length === 0) {
      return;
    }
    const body =
      titles.length === 1
        ? `오늘은 '${titles[0]}' 할 차례예요.`
        : `오늘 할 일 ${titles.length}개가 있어요: ${titles.join(', ')}`;
    tokens.forEach(deviceToken => {
      sendPromises.push(
        messaging
          .send({
            token: deviceToken.token,
            notification: { title: '집안일 알림', body },
          })
          .catch(() => {
            // 만료/무효화된 토큰 등은 무시하고 나머지 발송을 계속 진행한다.
          }),
      );
    });
  });

  await Promise.all(sendPromises);
};
